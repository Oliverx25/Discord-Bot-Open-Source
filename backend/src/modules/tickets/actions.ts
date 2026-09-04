import type { TicketSettings, TicketSummary } from "@adobos/shared";
import {
  applyTicketNameTemplate,
  clampTicketTranscript,
  TICKET_ADD_PREFIX,
  TICKET_CLAIM_PREFIX,
  TICKET_CLOSE_PREFIX,
  TICKET_REMOVE_PREFIX,
  TICKET_STATUS_LABEL,
  TICKET_UNCLAIM_PREFIX,
  TICKET_UNWAIT_PREFIX,
  TICKET_WAIT_PREFIX,
} from "@adobos/shared";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import type {
  BotGateway,
  ChannelMessageBrief,
} from "#core/discord/botGateway.js";
import { logger } from "#core/log.js";
import {
  addTicketParticipant,
  appendChannelDeletedEvent,
  applyTicketAction,
  assertCanOpenTicket,
  getTicketByChannelId,
  getTicketById,
  getTicketSettings,
  insertOpenedTicket,
  removeTicketParticipant,
  setTicketChannelId,
  TicketsError,
} from "./domain/tickets.js";

/** Referencia mínima de un miembro (solo lo que usan las acciones). */
interface ActorRef {
  id: string;
  displayName: string;
}

function orBits(bits: bigint[]): bigint {
  return bits.reduce((acc, bit) => acc | bit, 0n);
}

const TICKET_ALLOW_BITS = orBits([
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
]);

const BOT_ALLOW_BITS =
  TICKET_ALLOW_BITS |
  PermissionFlagsBits.ManageChannels |
  PermissionFlagsBits.ManageMessages;

function embedColorInt(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isFinite(n) ? n : 0x5865f2;
}

export async function requireGuild(
  gateway: BotGateway,
  guildId: string,
): Promise<void> {
  const guild = await gateway.getGuild(guildId);
  if (!guild) {
    throw new TicketsError(
      "The bot is not in this server.",
      400,
      "GUILD_NOT_FOUND",
    );
  }
}

/** El canal (id) de un ticket, si sigue existiendo como canal de texto del guild. */
async function findTicketChannelId(
  gateway: BotGateway,
  guildId: string,
  channelId: string | null,
): Promise<string | null> {
  if (!channelId) return null;
  const channel = await gateway.getChannel(guildId, channelId);
  return channel && channel.type === ChannelType.GuildText ? channel.id : null;
}

function controlRows(ticket: TicketSummary): ActionRowBuilder<ButtonBuilder>[] {
  const id = String(ticket.id);
  const row1 = new ActionRowBuilder<ButtonBuilder>();
  if (ticket.status === "open") {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${TICKET_CLAIM_PREFIX}${id}`)
        .setLabel("Claim")
        .setStyle(ButtonStyle.Success),
    );
  }
  if (ticket.status === "claimed") {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${TICKET_UNCLAIM_PREFIX}${id}`)
        .setLabel("Unclaim")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`${TICKET_WAIT_PREFIX}${id}`)
        .setLabel("Waiting")
        .setStyle(ButtonStyle.Primary),
    );
  }
  if (ticket.status === "waiting") {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${TICKET_UNWAIT_PREFIX}${id}`)
        .setLabel("Unwait")
        .setStyle(ButtonStyle.Primary),
    );
  }
  if (ticket.status !== "closed") {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${TICKET_CLOSE_PREFIX}${id}`)
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger),
    );
  }
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${TICKET_ADD_PREFIX}${id}`)
      .setLabel("Add")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${TICKET_REMOVE_PREFIX}${id}`)
      .setLabel("Remove")
      .setStyle(ButtonStyle.Secondary),
  );
  return ticket.status === "closed" ? [] : [row1, row2];
}

function ticketEmbed(ticket: TicketSummary): EmbedBuilder {
  const staff = ticket.claimedBy ? `<@${ticket.claimedBy}>` : "Nobody yet";
  return new EmbedBuilder()
    .setColor(embedColorInt("#5865F2"))
    .setTitle(`Ticket #${ticket.number}`)
    .setDescription(
      [
        `Status: **${TICKET_STATUS_LABEL[ticket.status]}**`,
        `Type: \`${ticket.typeKey}\``,
        `Opened by: <@${ticket.openerId}>`,
        `Staff: ${staff}`,
      ].join("\n"),
    );
}

export async function upsertControlMessage(
  gateway: BotGateway,
  guildId: string,
  channelId: string,
  ticket: TicketSummary,
): Promise<void> {
  const payload = {
    embeds: [ticketEmbed(ticket).toJSON()],
    components: controlRows(ticket).map((row) => row.toJSON()),
  };
  try {
    const recent = await gateway.listChannelMessages(channelId, { limit: 20 });
    const mine = recent.find((msg) => msg.authorIsBot && msg.hasComponents);
    if (mine) {
      await gateway.editMessage(guildId, channelId, mine.id, payload);
      return;
    }
  } catch {
    // sin historial o sin permiso: enviamos uno nuevo
  }
  const sent = await gateway.sendMessage(guildId, channelId, payload);
  await gateway.pinMessage(channelId, sent.messageId).catch(() => undefined);
}

async function createTicketChannel(
  gateway: BotGateway,
  guildId: string,
  settings: TicketSettings,
  ticket: TicketSummary,
  opener: ActorRef,
): Promise<string> {
  const botId = await gateway.getBotUserId();
  if (!botId) {
    throw new TicketsError(
      "The bot is not in this server.",
      500,
      "BOT_NOT_IN_GUILD",
    );
  }
  if (!settings.categoryId) {
    throw new TicketsError(
      "Configure a ticket category in the panel.",
      400,
      "MISSING_CATEGORY",
    );
  }
  const name = applyTicketNameTemplate(settings.nameTemplate, {
    n: ticket.number,
    user: opener.displayName,
    typeKey: ticket.typeKey,
  });
  try {
    const channel = await gateway.createChannel(guildId, {
      name,
      type: ChannelType.GuildText,
      parentId: settings.categoryId,
      permissionOverwrites: [
        {
          id: guildId,
          type: 0,
          deny: PermissionFlagsBits.ViewChannel.toString(),
        },
        { id: botId, type: 1, allow: BOT_ALLOW_BITS.toString() },
        { id: opener.id, type: 1, allow: TICKET_ALLOW_BITS.toString() },
        ...settings.staffRoleIds.map((roleId) => ({
          id: roleId,
          type: 0,
          allow: TICKET_ALLOW_BITS.toString(),
        })),
      ],
      reason: `Tickets: #${ticket.number}`,
    });
    return channel.id;
  } catch (error: unknown) {
    logger.warn({ err: error, guildId }, "Couldn't create the ticket channel");
    throw new TicketsError(
      "Couldn't create the channel. Make sure the bot has the Manage Channels permission in that category.",
      400,
      "CHANNEL_CREATE_FAILED",
    );
  }
}

async function collectTranscript(
  gateway: BotGateway,
  channelId: string,
): Promise<string> {
  const collected: ChannelMessageBrief[] = [];
  let before: string | undefined;
  for (let i = 0; i < 10; i++) {
    const batch = await gateway.listChannelMessages(channelId, {
      limit: 100,
      before,
    });
    if (batch.length === 0) break;
    collected.push(...batch);
    before = batch[batch.length - 1]?.id;
    if (batch.length < 100) break;
  }
  collected.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const lines = collected.map((msg) => {
    const extra = msg.attachmentCount
      ? ` [${msg.attachmentCount} attachment(s)]`
      : "";
    const body = msg.content.trim() ? msg.content : extra ? "" : "(no text)";
    return `[${msg.createdAt}] ${msg.authorTag}: ${body}${extra}`;
  });
  return clampTicketTranscript(lines.join("\n"));
}

async function postTicketLog(
  gateway: BotGateway,
  guildId: string,
  settings: TicketSettings,
  ticket: TicketSummary,
  title: string,
  body: string,
  file?: { name: string; text: string },
): Promise<void> {
  if (!settings.logChannelId) return;
  const channel = await gateway.getChannel(guildId, settings.logChannelId);
  if (!channel || channel.type !== ChannelType.GuildText) return;
  const embed = new EmbedBuilder()
    .setColor(embedColorInt("#5865F2"))
    .setTitle(title)
    .setDescription(body.slice(0, 4096))
    .setFooter({ text: `Ticket #${ticket.number}` })
    .setTimestamp(new Date());
  await gateway
    .sendMessage(guildId, settings.logChannelId, {
      embeds: [embed.toJSON()],
      files: file
        ? [{ name: file.name, data: Buffer.from(file.text, "utf8") }]
        : undefined,
    })
    .catch((error: unknown) => {
      logger.warn({ err: error }, "Couldn't send the ticket log");
    });
}

async function dmTranscript(
  gateway: BotGateway,
  openerId: string,
  ticket: TicketSummary,
  text: string,
): Promise<void> {
  await gateway
    .sendDirectMessage(openerId, {
      content: `Transcript for ticket #${ticket.number} (${ticket.typeKey}).`,
      files: [
        {
          name: `ticket-${ticket.number}.txt`,
          data: Buffer.from(text, "utf8"),
        },
      ],
    })
    .catch(() => undefined);
}

export async function openTicket(input: {
  gateway: BotGateway;
  guildId: string;
  opener: ActorRef;
  typeKey: string;
  reason?: string | null;
}): Promise<TicketSummary> {
  const settings = await assertCanOpenTicket(input.guildId, input.opener.id);
  const ticket = await insertOpenedTicket({
    guildId: input.guildId,
    openerId: input.opener.id,
    typeKey: input.typeKey,
    reason: input.reason ?? null,
  });
  let channelId: string;
  try {
    channelId = await createTicketChannel(
      input.gateway,
      input.guildId,
      settings,
      ticket,
      input.opener,
    );
  } catch (error: unknown) {
    await applyTicketAction({
      ticketId: ticket.id,
      guildId: ticket.guildId,
      action: "close",
      actorId: "system",
      closeReason: "Couldn't create the channel",
      channelId: null,
    }).catch(() => undefined);
    throw error;
  }
  await setTicketChannelId(ticket.id, channelId);
  const live = { ...ticket, channelId };
  await input.gateway.sendMessage(input.guildId, channelId, {
    content: `<@${input.opener.id}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(embedColorInt("#5865F2"))
        .setTitle(`Ticket #${ticket.number}`)
        .setDescription(
          `Type: \`${ticket.typeKey}\`\nA staff member will assist you here.`,
        )
        .toJSON(),
    ],
  });
  await upsertControlMessage(input.gateway, input.guildId, channelId, live);
  await postTicketLog(
    input.gateway,
    input.guildId,
    settings,
    live,
    `Ticket #${ticket.number} abierto`,
    `Tipo \`${ticket.typeKey}\` · <@${input.opener.id}> · <#${channelId}>`,
  );
  return live;
}

async function requireLiveChannelId(
  gateway: BotGateway,
  guildId: string,
  ticket: TicketSummary,
): Promise<string> {
  if (!ticket.channelId) {
    throw new TicketsError(
      "This ticket no longer has a Discord channel.",
      409,
      "NO_CHANNEL",
    );
  }
  const channelId = await findTicketChannelId(
    gateway,
    guildId,
    ticket.channelId,
  );
  if (!channelId) {
    throw new TicketsError(
      "I can't find this ticket's channel.",
      404,
      "CHANNEL_NOT_FOUND",
    );
  }
  return channelId;
}

export async function claimTicket(input: {
  gateway: BotGateway;
  guildId: string;
  ticketId: number;
  actor: ActorRef;
}): Promise<TicketSummary> {
  const current = await getTicketById(input.ticketId, input.guildId);
  if (current.claimedBy === input.actor.id && current.status === "claimed") {
    throw new TicketsError(
      "You already have this ticket.",
      409,
      "ALREADY_CLAIMER",
    );
  }
  const action =
    current.status === "claimed" || current.status === "waiting"
      ? "transfer"
      : "claim";
  const ticket = await applyTicketAction({
    ticketId: current.id,
    guildId: current.guildId,
    action,
    actorId: input.actor.id,
    claimedBy: input.actor.id,
    payload: { fromStaff: current.claimedBy, toStaff: input.actor.id },
  });
  const channelId = await requireLiveChannelId(
    input.gateway,
    input.guildId,
    ticket,
  );
  await input.gateway
    .putChannelOverwrite(channelId, input.actor.id, {
      type: 1,
      allow: TICKET_ALLOW_BITS.toString(),
      deny: "0",
    })
    .catch(() => undefined);
  await upsertControlMessage(input.gateway, input.guildId, channelId, ticket);
  const settings = await getTicketSettings(input.guildId);
  await postTicketLog(
    input.gateway,
    input.guildId,
    settings,
    ticket,
    `Ticket #${ticket.number} ${action === "transfer" ? "transferido" : "reclamado"}`,
    `<@${input.actor.id}> atiende este ticket.`,
  );
  return ticket;
}

async function refreshControl(
  gateway: BotGateway,
  guildId: string,
  ticket: TicketSummary,
): Promise<void> {
  const channelId = await findTicketChannelId(
    gateway,
    guildId,
    ticket.channelId,
  );
  if (channelId) {
    await upsertControlMessage(gateway, guildId, channelId, ticket);
  }
}

export async function unclaimTicket(input: {
  gateway: BotGateway;
  guildId: string;
  ticketId: number;
  actorId: string;
}): Promise<TicketSummary> {
  const ticket = await applyTicketAction({
    ticketId: input.ticketId,
    guildId: input.guildId,
    action: "unclaim",
    actorId: input.actorId,
  });
  await refreshControl(input.gateway, input.guildId, ticket);
  return ticket;
}

export async function waitTicket(input: {
  gateway: BotGateway;
  guildId: string;
  ticketId: number;
  actorId: string;
}): Promise<TicketSummary> {
  const ticket = await applyTicketAction({
    ticketId: input.ticketId,
    guildId: input.guildId,
    action: "wait",
    actorId: input.actorId,
  });
  await refreshControl(input.gateway, input.guildId, ticket);
  return ticket;
}

export async function unwaitTicket(input: {
  gateway: BotGateway;
  guildId: string;
  ticketId: number;
  actorId: string;
}): Promise<TicketSummary> {
  const ticket = await applyTicketAction({
    ticketId: input.ticketId,
    guildId: input.guildId,
    action: "unwait",
    actorId: input.actorId,
  });
  await refreshControl(input.gateway, input.guildId, ticket);
  return ticket;
}

export async function closeTicket(input: {
  gateway: BotGateway;
  guildId: string;
  ticketId: number;
  actorId: string;
  reason: string;
}): Promise<TicketSummary> {
  const current = await getTicketById(input.ticketId, input.guildId);
  let transcript = "";
  let channelId: string | null = null;
  if (current.channelId) {
    channelId = await findTicketChannelId(
      input.gateway,
      input.guildId,
      current.channelId,
    );
    if (channelId) {
      transcript = await collectTranscript(input.gateway, channelId).catch(
        () => "",
      );
    }
  }
  const ticket = await applyTicketAction({
    ticketId: current.id,
    guildId: current.guildId,
    action: "close",
    actorId: input.actorId,
    closeReason: input.reason,
    transcriptText: transcript || null,
    channelId: null,
  });
  const settings = await getTicketSettings(input.guildId);
  await postTicketLog(
    input.gateway,
    input.guildId,
    settings,
    ticket,
    `Ticket #${ticket.number} closed`,
    `Reason: ${input.reason}\nBy: <@${input.actorId}>`,
    transcript
      ? { name: `ticket-${ticket.number}.txt`, text: transcript }
      : undefined,
  );
  if (transcript) {
    await dmTranscript(input.gateway, current.openerId, ticket, transcript);
  }
  if (channelId) {
    await input.gateway
      .deleteChannel(
        input.guildId,
        channelId,
        `Tickets: close #${ticket.number}`,
      )
      .catch((error: unknown) => {
        logger.warn({ err: error }, "Couldn't delete the ticket channel");
      });
  }
  return ticket;
}

export async function reopenTicket(input: {
  gateway: BotGateway;
  guildId: string;
  ticketId: number;
  actor: ActorRef;
}): Promise<TicketSummary> {
  const current = await getTicketById(input.ticketId, input.guildId);
  const settings = await getTicketSettings(input.guildId);
  if (!settings.categoryId || settings.staffRoleIds.length === 0) {
    throw new TicketsError(
      "Configure a category and staff roles before reopening.",
      400,
      "MISSING_SETTINGS",
    );
  }
  const openerMember = await input.gateway.getMember(
    input.guildId,
    current.openerId,
  );
  const opener: ActorRef = openerMember
    ? { id: openerMember.userId, displayName: openerMember.displayName }
    : input.actor;
  const placeholder = await applyTicketAction({
    ticketId: current.id,
    guildId: current.guildId,
    action: "reopen",
    actorId: input.actor.id,
    channelId: null,
    payload: { previousChannelId: current.channelId },
  });
  const channelId = await createTicketChannel(
    input.gateway,
    input.guildId,
    settings,
    placeholder,
    opener,
  );
  await setTicketChannelId(placeholder.id, channelId);
  const live = {
    ...placeholder,
    channelId,
    status: "open" as const,
  };
  await input.gateway.sendMessage(input.guildId, channelId, {
    content: `<@${current.openerId}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(embedColorInt("#5865F2"))
        .setTitle(`Ticket #${current.number} reopened`)
        .setDescription(`Type: \`${current.typeKey}\``)
        .toJSON(),
    ],
  });
  await upsertControlMessage(input.gateway, input.guildId, channelId, live);
  await postTicketLog(
    input.gateway,
    input.guildId,
    settings,
    live,
    `Ticket #${current.number} reopened`,
    `<@${input.actor.id}> · <#${channelId}>`,
  );
  return live;
}

export async function addUserToTicket(input: {
  gateway: BotGateway;
  guildId: string;
  ticketId: number;
  actorId: string;
  userId: string;
}): Promise<TicketSummary> {
  const ticket = await addTicketParticipant(
    input.ticketId,
    input.guildId,
    input.userId,
    input.actorId,
  );
  const channelId = await requireLiveChannelId(
    input.gateway,
    input.guildId,
    ticket,
  );
  await input.gateway.putChannelOverwrite(channelId, input.userId, {
    type: 1,
    allow: TICKET_ALLOW_BITS.toString(),
    deny: "0",
  });
  await input.gateway.sendMessage(input.guildId, channelId, {
    content: `<@${input.userId}> was added to the ticket.`,
  });
  return ticket;
}

export async function removeUserFromTicket(input: {
  gateway: BotGateway;
  guildId: string;
  ticketId: number;
  actorId: string;
  userId: string;
}): Promise<TicketSummary> {
  const ticket = await removeTicketParticipant(
    input.ticketId,
    input.guildId,
    input.userId,
    input.actorId,
  );
  const channelId = await findTicketChannelId(
    input.gateway,
    input.guildId,
    ticket.channelId,
  );
  if (channelId) {
    await input.gateway
      .deleteChannelOverwrite(channelId, input.userId)
      .catch(() => undefined);
  }
  return ticket;
}

export async function onTicketChannelDeleted(channelId: string): Promise<void> {
  const ticket = await getTicketByChannelId(channelId);
  if (!ticket) return;
  if (ticket.status === "closed") return;
  await appendChannelDeletedEvent(ticket);
}

export async function onTicketChannelMessage(input: {
  gateway: BotGateway;
  guildId: string;
  channelId: string;
  authorId: string;
  bot: boolean;
}): Promise<void> {
  if (input.bot) return;
  const ticket = await getTicketByChannelId(input.channelId);
  if (!ticket || ticket.status !== "waiting") return;
  if (ticket.openerId !== input.authorId) return;
  const updated = await applyTicketAction({
    ticketId: ticket.id,
    guildId: ticket.guildId,
    action: "unwait",
    actorId: input.authorId,
  });
  await upsertControlMessage(
    input.gateway,
    input.guildId,
    input.channelId,
    updated,
  ).catch(() => undefined);
}
