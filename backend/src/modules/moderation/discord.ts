import type {
  ModActionRequest,
  ModActionResponse,
  ModActionType,
  ModActiveBansResponse,
  ModActiveTimeoutsResponse,
  ModChannelInfoResponse,
  ModChannelSearchResponse,
  ModFetchedMessageResponse,
  ModMemberInfoResponse,
  ModMemberSearchResponse,
} from "@adobos/shared";
import { MOD_ACTION_TYPES } from "@adobos/shared";
import { ChannelType, DiscordAPIError, PermissionFlagsBits } from "discord.js";
import { and, desc, eq } from "drizzle-orm";
import {
  type BotGateway,
  BotGatewayError,
  type MemberActionability,
  type MemberInfo,
} from "#core/discord/botGateway.js";
import { attachmentsToOutgoingFiles } from "#core/discord/outgoing.js";
import { logger } from "#core/log.js";
import { getDb, one } from "#db/client.js";
import {
  autorolesRegistry,
  guildSettings,
  modLogs,
  warnings,
} from "#db/schema.js";
import { getEmbedTemplate } from "#modules/messages/templates/service.js";
import {
  applySanctionTextVars,
  buildEmbedFromPayload,
  createReentryInvite,
  interpolateEmbedPayload,
  type SanctionDmContext,
} from "./dm.js";
import { clampTimeoutSeconds } from "./duration.js";

export class ModerationError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ModerationError";
  }
}

/**
 * Valida el guildId y confirma que el bot está en el guild (vía `BotGateway`).
 * Devuelve `{ id, name }` — `name` lo usa el DM de sanción.
 */
async function resolveGuild(
  gateway: BotGateway,
  guildId?: string,
): Promise<{ id: string; name: string }> {
  const id = resolveGuildId(gateway, guildId);
  const guild = await gateway.getGuild(id);
  if (!guild) {
    throw new ModerationError(
      "The bot is not in that server.",
      404,
      "GUILD_NOT_FOUND",
    );
  }
  return { id, name: guild.name };
}

/** Validación mínima para las rutas de lectura (que van por `BotGateway`). */
function resolveGuildId(gateway: BotGateway, guildId?: string): string {
  if (!gateway.isReady()) {
    throw new ModerationError(
      "The Discord bot is not connected.",
      503,
      "BOT_NOT_READY",
    );
  }
  const id = (guildId ?? "").trim();
  if (!id) {
    throw new ModerationError("Missing guildId.", 400, "MISSING_GUILD_ID");
  }
  return id;
}

function assertSnowflake(value: string, field: string): string {
  const trimmed = value.trim();
  if (!/^\d{17,20}$/.test(trimmed)) {
    throw new ModerationError(`Invalid ${field}.`, 400, "INVALID_IDS");
  }
  return trimmed;
}

async function ensureGuildRow(guildId: string): Promise<void> {
  const db = getDb();
  const existing = await one(
    db
      .select()
      .from(guildSettings)
      .where(eq(guildSettings.guildId, guildId))
      .limit(1),
  );
  if (!existing) {
    await db.insert(guildSettings).values({
      guildId,
      prefix: "!",
      welcomeEnabled: false,
      updatedAt: new Date(),
    });
  }
}

function mapDiscordError(error: unknown): never {
  if (error instanceof ModerationError) throw error;
  if (error instanceof BotGatewayError) {
    throw new ModerationError(error.message, error.status, error.code);
  }

  if (error instanceof DiscordAPIError) {
    if (error.code === 50013 || error.status === 403) {
      throw new ModerationError(
        "Insufficient permissions or role hierarchy: the bot can't apply this action.",
        403,
        "MISSING_PERMISSIONS",
      );
    }
    if (error.code === 50035) {
      throw new ModerationError(
        "Invalid parameters for Discord.",
        400,
        "INVALID_DISCORD_PARAMS",
      );
    }
    throw new ModerationError(
      error.message || "Discord API error.",
      error.status && error.status >= 400 ? error.status : 502,
      "DISCORD_API_ERROR",
    );
  }

  if (error instanceof Error) {
    throw new ModerationError(error.message, 502, "ACTION_FAILED");
  }

  throw new ModerationError("Unknown error.", 500, "INTERNAL_ERROR");
}

function assertBotCanAct(
  act: MemberActionability,
  targetUserId: string,
  action: "ban" | "kick" | "timeout" | "untimeout",
  actorUserId?: string,
): void {
  if (act.isBot) {
    throw new ModerationError(
      "You can't apply this action to the bot.",
      400,
      "TARGET_IS_BOT",
    );
  }
  if (
    actorUserId &&
    targetUserId === actorUserId &&
    (action === "ban" || action === "kick" || action === "timeout")
  ) {
    throw new ModerationError(
      "You can't apply this action to yourself.",
      400,
      "TARGET_IS_SELF",
    );
  }
  if (action === "ban" && !act.bannable) {
    throw new ModerationError(
      "Role hierarchy: I can't ban that member.",
      403,
      "MEMBER_NOT_BANNABLE",
    );
  }
  if (action === "kick" && !act.kickable) {
    throw new ModerationError(
      "Role hierarchy: I can't kick that member.",
      403,
      "MEMBER_NOT_KICKABLE",
    );
  }
  if ((action === "timeout" || action === "untimeout") && !act.moderatable) {
    throw new ModerationError(
      "Role hierarchy: I can't time out that member.",
      403,
      "MEMBER_NOT_MODERATABLE",
    );
  }
}

function memberHit(member: MemberInfo) {
  return {
    id: member.userId,
    username: member.username,
    globalName: member.globalName,
    displayName: member.displayName,
    avatarUrl: member.avatarUrl,
    bot: member.bot,
  };
}

/**
 * Ranking case-insensitive:
 * 0 = coincidencia exacta, 1 = empieza con, 2 = contiene, 99 = no match.
 */
function relevanceWeight(haystacks: string[], needle: string): number {
  const q = needle.toLowerCase();
  if (!q) return 99;
  let best = 99;
  for (const raw of haystacks) {
    const h = raw.trim().toLowerCase();
    if (!h) continue;
    if (h === q) best = Math.min(best, 0);
    else if (h.startsWith(q)) best = Math.min(best, 1);
    else if (h.includes(q)) best = Math.min(best, 2);
  }
  return best;
}

function memberSearchFields(member: MemberInfo): string[] {
  return [
    member.username,
    member.displayName,
    member.globalName ?? "",
    member.userId,
  ];
}

function rankMembersByQuery(
  members: MemberInfo[],
  query: string,
): MemberInfo[] {
  return members
    .map((member) => ({
      member,
      weight: relevanceWeight(memberSearchFields(member), query),
    }))
    .filter((row) => row.weight < 99)
    .sort((a, b) => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      return a.member.displayName.localeCompare(b.member.displayName, "es", {
        sensitivity: "base",
      });
    })
    .map((row) => row.member);
}

export async function searchMembers(
  gateway: BotGateway,
  queryRaw: string,
  guildId?: string,
): Promise<ModMemberSearchResponse> {
  const id = resolveGuildId(gateway, guildId);
  const q = queryRaw.trim();

  try {
    if (/^\d{17,20}$/.test(q)) {
      const member = await gateway.getMember(id, q);
      return { members: member ? [memberHit(member)] : [] };
    }

    const all = await gateway.listMembers(id);

    if (q.length < 1) {
      const sorted = [...all].sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "es", {
          sensitivity: "base",
        }),
      );
      return { members: sorted.map(memberHit) };
    }

    return { members: rankMembersByQuery(all, q).map(memberHit) };
  } catch (error: unknown) {
    mapDiscordError(error);
  }
}

export async function searchChannels(
  gateway: BotGateway,
  queryRaw: string,
  guildId?: string,
): Promise<ModChannelSearchResponse> {
  const id = resolveGuildId(gateway, guildId);
  const q = queryRaw.trim().toLowerCase();

  const channels = (await gateway.listChannels(id))
    .filter(
      (channel) =>
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildAnnouncement,
    )
    .filter((channel) => {
      if (!q) return true;
      if (/^\d{17,20}$/.test(q)) return channel.id === q;
      return channel.name.toLowerCase().includes(q);
    })
    .sort((a, b) => a.position - b.position)
    .slice(0, 20)
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
    }));

  return { channels };
}

export async function getMemberInfo(
  gateway: BotGateway,
  userIdRaw: string,
  guildId?: string,
): Promise<ModMemberInfoResponse> {
  const id = resolveGuildId(gateway, guildId);
  const userId = assertSnowflake(userIdRaw, "userId");

  const warningRows = (
    await getDb()
      .select()
      .from(warnings)
      .where(and(eq(warnings.guildId, id), eq(warnings.userId, userId)))
      .orderBy(desc(warnings.createdAt))
  ).map((row) => ({
    id: row.id,
    reason: row.reason,
    moderatorId: row.moderatorId,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
  }));

  const member = await gateway.getMember(id, userId);
  if (member) {
    return {
      id: member.userId,
      username: member.username,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      joinedAt: member.joinedAt,
      roles: member.roles.slice(0, 12).map((role) => ({
        id: role.id,
        name: role.name,
        color: role.hexColor === "#000000" ? null : role.hexColor,
      })),
      warnings: warningRows,
      timedOutUntil: member.timedOutUntil,
    };
  }

  // Usuario baneado / fuera del servidor: expediente mínimo vía User API.
  const user = await gateway.getUser(userId);
  if (!user) {
    throw new ModerationError("Member not found.", 404, "MEMBER_NOT_FOUND");
  }
  return {
    id: user.userId,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    joinedAt: null,
    roles: [],
    warnings: warningRows,
    timedOutUntil: null,
  };
}

export async function listActiveBans(
  gateway: BotGateway,
  guildId?: string,
): Promise<ModActiveBansResponse> {
  const id = resolveGuildId(gateway, guildId);
  try {
    const items = (await gateway.listBans(id))
      .map((ban) => ({
        id: ban.userId,
        username: ban.username,
        displayName: ban.displayName,
        avatarUrl: ban.avatarUrl,
        reason: ban.reason,
      }))
      .sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "es", {
          sensitivity: "base",
        }),
      );
    return { bans: items };
  } catch (error: unknown) {
    mapDiscordError(error);
  }
}

export async function listActiveTimeouts(
  gateway: BotGateway,
  guildId?: string,
): Promise<ModActiveTimeoutsResponse> {
  const id = resolveGuildId(gateway, guildId);
  try {
    const now = Date.now();
    const timeouts = (await gateway.listMembers(id))
      .filter((member) => {
        const until = member.timedOutUntil
          ? Date.parse(member.timedOutUntil)
          : Number.NaN;
        return Number.isFinite(until) && until > now;
      })
      .map((member) => {
        const until = Date.parse(member.timedOutUntil as string);
        return {
          id: member.userId,
          username: member.username,
          displayName: member.displayName,
          avatarUrl: member.avatarUrl,
          timedOutUntil: new Date(until).toISOString(),
          remainingSeconds: Math.max(0, Math.ceil((until - now) / 1000)),
        };
      })
      .sort((a, b) => a.remainingSeconds - b.remainingSeconds);

    return { timeouts };
  } catch (error: unknown) {
    mapDiscordError(error);
  }
}

export async function getChannelInfo(
  gateway: BotGateway,
  channelIdRaw: string,
  guildId?: string,
): Promise<ModChannelInfoResponse> {
  const id = resolveGuildId(gateway, guildId);
  const channelId = assertSnowflake(channelIdRaw, "channelId");

  const channel = await gateway.getChannelDetail(id, channelId);
  if (
    !channel ||
    (channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement)
  ) {
    throw new ModerationError(
      "Text channel not found.",
      404,
      "CHANNEL_NOT_FOUND",
    );
  }

  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    slowmodeSeconds: channel.slowmodeSeconds,
    topic: channel.topic,
    nsfw: channel.nsfw,
  };
}

function assertAction(raw: string): ModActionType {
  if (MOD_ACTION_TYPES.includes(raw as ModActionType)) {
    return raw as ModActionType;
  }
  throw new ModerationError("Invalid action.", 400, "INVALID_ACTION");
}

async function writeModLog(input: {
  guildId: string;
  action: string;
  targetUserId?: string | null;
  targetChannelId?: string | null;
  moderatorId: string;
  reason: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await getDb()
    .insert(modLogs)
    .values({
      guildId: input.guildId,
      action: input.action,
      targetUserId: input.targetUserId ?? null,
      targetChannelId: input.targetChannelId ?? null,
      moderatorId: input.moderatorId,
      reason: input.reason,
      meta: input.meta ?? null,
      createdAt: new Date(),
    });
}

async function sendSanctionDm(options: {
  gateway: BotGateway;
  guildId: string;
  guildName: string;
  botUsername: string;
  userId: string;
  action: ModActionType;
  reason: string;
  dmMode?: string;
  dmText?: string;
  templateId?: number;
}): Promise<{ dmSent: boolean; dmSkipped: boolean; dmFailed: boolean }> {
  const { gateway, guildId, guildName, userId, action, reason } = options;

  if (action === "unban") {
    return { dmSent: false, dmSkipped: true, dmFailed: false };
  }

  const dmMode = options.dmMode ?? "none";
  if (dmMode === "none" || (dmMode !== "text" && dmMode !== "template")) {
    return { dmSent: false, dmSkipped: true, dmFailed: false };
  }

  let inviteUrl: string | undefined;
  if (action === "kick") {
    inviteUrl = (await createReentryInvite(gateway, guildId)) ?? undefined;
  }

  const [user, member] = await Promise.all([
    gateway.getUser(userId),
    gateway.getMember(guildId, userId),
  ]);
  const username = user?.username ?? userId;
  const vars: SanctionDmContext = {
    userMention: `<@${userId}>`,
    username,
    displayName:
      member?.displayName || user?.globalName || user?.username || username,
    serverName: guildName,
    reason,
    moderator: options.botUsername || "Adobos Bot",
    action,
    inviteUrl,
  };

  try {
    if (dmMode === "text") {
      let content = applySanctionTextVars(
        (options.dmText ?? "").trim() ||
          `You received a sanction (${action}) in {server}.\nReason: {reason}`,
        vars,
      );
      if (inviteUrl) {
        content = `${content}\n\nYou can come back with this invite (1 use): ${inviteUrl}`;
      }
      const { sent } = await gateway.sendDirectMessage(userId, {
        content: content.slice(0, 2000),
      });
      return sent
        ? { dmSent: true, dmSkipped: false, dmFailed: false }
        : { dmSent: false, dmSkipped: false, dmFailed: true };
    }

    // template
    const templateId = Number(options.templateId);
    if (!Number.isFinite(templateId)) {
      throw new ModerationError("Invalid templateId.", 400, "INVALID_TEMPLATE");
    }
    const template = await getEmbedTemplate(templateId, guildId);
    const interpolated = interpolateEmbedPayload(template.embedData, vars);
    const built = buildEmbedFromPayload(interpolated);
    let content = built.content
      ? applySanctionTextVars(built.content, vars)
      : undefined;
    if (inviteUrl) {
      content = content
        ? `${content}\n\nYou can come back with this invite (1 use): ${inviteUrl}`
        : `You can come back with this invite (1 use): ${inviteUrl}`;
    }
    const { sent } = await gateway.sendDirectMessage(userId, {
      content,
      embeds: built.builder ? [built.builder.toJSON()] : undefined,
      files: attachmentsToOutgoingFiles(built.files),
    });
    return sent
      ? { dmSent: true, dmSkipped: false, dmFailed: false }
      : { dmSent: false, dmSkipped: false, dmFailed: true };
  } catch (error: unknown) {
    if (error instanceof ModerationError) throw error;
    logger.warn(
      { err: error instanceof Error ? error.message : error },
      "Sanction DM not sent:",
    );
    return { dmSent: false, dmSkipped: false, dmFailed: true };
  }
}

/** Tipos de canal que admiten bulk delete de mensajes. */
const BULK_DELETE_TYPES = new Set([
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildVoice,
  ChannelType.GuildStageVoice,
  ChannelType.AnnouncementThread,
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
]);

/** Contexto compartido que recibe cada handler de acción de moderación. */
interface ModActionCtx {
  gateway: BotGateway;
  guild: { id: string; name: string };
  input: ModActionRequest;
  auditReason: string;
  moderatorId: string;
  actorUserId?: string;
}

/** Lo que produce un handler — `writeModLog` y el mensaje final salen de acá. */
interface ModActionOutcome {
  message: string;
  targetUserId?: string | null;
  targetChannelId?: string | null;
}

type ModActionHandler = (ctx: ModActionCtx) => Promise<ModActionOutcome>;

async function handleWarn(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const userId = assertSnowflake(ctx.input.userId ?? "", "userId");
  const member = await ctx.gateway.getMember(ctx.guild.id, userId);
  if (!member) {
    throw new ModerationError("Member not found.", 404, "MEMBER_NOT_FOUND");
  }
  await getDb().insert(warnings).values({
    guildId: ctx.guild.id,
    userId,
    moderatorId: ctx.moderatorId,
    reason: ctx.auditReason,
    createdAt: new Date(),
  });
  return {
    message: `Warning recorded for <@${userId}>.`,
    targetUserId: userId,
  };
}

async function handleKick(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const userId = assertSnowflake(ctx.input.userId ?? "", "userId");
  const [member, actionability] = await Promise.all([
    ctx.gateway.getMember(ctx.guild.id, userId),
    ctx.gateway.getMemberActionability(ctx.guild.id, userId),
  ]);
  if (!member || !actionability) {
    throw new ModerationError("Member not found.", 404, "MEMBER_NOT_FOUND");
  }
  assertBotCanAct(actionability, userId, "kick", ctx.actorUserId);
  await ctx.gateway.kickMember(ctx.guild.id, userId, ctx.auditReason);
  return { message: `${member.username} fue expulsado.`, targetUserId: userId };
}

async function handleBan(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const userId = assertSnowflake(ctx.input.userId ?? "", "userId");
  const days = Math.max(
    0,
    Math.min(7, Math.round(Number(ctx.input.deleteMessageDays ?? 0))),
  );
  const actionability = await ctx.gateway.getMemberActionability(
    ctx.guild.id,
    userId,
  );
  if (actionability) {
    assertBotCanAct(actionability, userId, "ban", ctx.actorUserId);
  }
  await ctx.gateway.banMember(ctx.guild.id, userId, {
    reason: ctx.auditReason,
    deleteMessageSeconds: days * 24 * 60 * 60,
  });
  return { message: `User ${userId} banned.`, targetUserId: userId };
}

async function handleUnban(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const userId = assertSnowflake(ctx.input.userId ?? "", "userId");
  await ctx.gateway.unbanMember(ctx.guild.id, userId, ctx.auditReason);
  return { message: `User ${userId} unbanned.`, targetUserId: userId };
}

async function handleTimeout(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const userId = assertSnowflake(ctx.input.userId ?? "", "userId");
  const seconds = clampTimeoutSeconds(ctx.input.durationSeconds);
  if (seconds === null) {
    throw new ModerationError(
      "Invalid timeout duration. Use between 1 second and 28 days (e.g. 10m, 1h, 24h).",
      400,
      "INVALID_TIMEOUT",
    );
  }
  const [member, actionability] = await Promise.all([
    ctx.gateway.getMember(ctx.guild.id, userId),
    ctx.gateway.getMemberActionability(ctx.guild.id, userId),
  ]);
  if (!member || !actionability) {
    throw new ModerationError("Member not found.", 404, "MEMBER_NOT_FOUND");
  }
  assertBotCanAct(actionability, userId, "timeout", ctx.actorUserId);
  const until = new Date(Date.now() + seconds * 1000).toISOString();
  await ctx.gateway.timeoutMember(ctx.guild.id, userId, until, ctx.auditReason);
  return {
    message: `${member.username} en timeout (${seconds}s).`,
    targetUserId: userId,
  };
}

async function handleUntimeout(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const userId = assertSnowflake(ctx.input.userId ?? "", "userId");
  const [member, actionability] = await Promise.all([
    ctx.gateway.getMember(ctx.guild.id, userId),
    ctx.gateway.getMemberActionability(ctx.guild.id, userId),
  ]);
  if (!member || !actionability) {
    throw new ModerationError("Member not found.", 404, "MEMBER_NOT_FOUND");
  }
  assertBotCanAct(actionability, userId, "untimeout", ctx.actorUserId);
  await ctx.gateway.timeoutMember(ctx.guild.id, userId, null, ctx.auditReason);
  return {
    message: `Timeout removido de ${member.username}.`,
    targetUserId: userId,
  };
}

async function handleClearwarns(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const userId = assertSnowflake(ctx.input.userId ?? "", "userId");
  const deleted = await getDb()
    .delete(warnings)
    .where(and(eq(warnings.guildId, ctx.guild.id), eq(warnings.userId, userId)))
    .returning({ id: warnings.id });
  const message =
    deleted.length === 0
      ? `There were no warnings for <@${userId}>.`
      : `Removed ${deleted.length} warnings from <@${userId}>.`;
  return { message, targetUserId: userId };
}

async function handlePurge(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const channelId = assertSnowflake(ctx.input.channelId ?? "", "channelId");
  const limit = Math.max(
    1,
    Math.min(100, Math.round(Number(ctx.input.purgeLimit ?? 10))),
  );
  const filterUserId = ctx.input.userId?.trim()
    ? assertSnowflake(ctx.input.userId, "userId")
    : null;
  const channel = await ctx.gateway.getChannel(ctx.guild.id, channelId);
  if (!channel || !BULK_DELETE_TYPES.has(channel.type)) {
    throw new ModerationError(
      "Invalid channel for purge.",
      400,
      "CHANNEL_NOT_TEXT",
    );
  }
  const deleted = await ctx.gateway.bulkDeleteMessages(channelId, {
    limit,
    filterUserId,
  });
  const message = filterUserId
    ? deleted === 0
      ? `No recent messages from <@${filterUserId}> in #${channel.name} (max 14 days).`
      : `Deleted ${deleted} messages from <@${filterUserId}> in #${channel.name}.`
    : `Deleted ${deleted} messages in #${channel.name}.`;
  return { message, targetChannelId: channelId };
}

async function handleSlowmode(ctx: ModActionCtx): Promise<ModActionOutcome> {
  const channelId = assertSnowflake(ctx.input.channelId ?? "", "channelId");
  const seconds = Math.max(
    0,
    Math.min(21600, Math.round(Number(ctx.input.slowmodeSeconds ?? 0))),
  );
  const channel = await ctx.gateway.getChannel(ctx.guild.id, channelId);
  if (
    !channel ||
    (channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement)
  ) {
    throw new ModerationError(
      "Text channel not found.",
      404,
      "CHANNEL_NOT_FOUND",
    );
  }
  await ctx.gateway.setChannelSlowmode(
    ctx.guild.id,
    channelId,
    seconds,
    ctx.auditReason,
  );
  const message =
    seconds === 0
      ? `Slowmode desactivado en #${channel.name}.`
      : `Slowmode de ${seconds}s en #${channel.name}.`;
  return { message, targetChannelId: channelId };
}

/** Handler compartido de `lock`/`unlock` — solo difiere en el bit SendMessages. */
function makeLockHandler(locked: boolean): ModActionHandler {
  return async (ctx) => {
    const channelId = assertSnowflake(ctx.input.channelId ?? "", "channelId");
    const channel = await ctx.gateway.getChannel(ctx.guild.id, channelId);
    if (
      !channel ||
      (channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildAnnouncement)
    ) {
      throw new ModerationError(
        "Text channel not found.",
        404,
        "CHANNEL_NOT_FOUND",
      );
    }
    const overwrites =
      (await ctx.gateway.getChannelOverwrites(ctx.guild.id, channelId)) ?? [];
    const everyone = overwrites.find((o) => o.id === ctx.guild.id);
    const bit = PermissionFlagsBits.SendMessages;
    const allow = BigInt(everyone?.allow ?? "0") & ~bit;
    const currentDeny = BigInt(everyone?.deny ?? "0");
    const deny = locked ? currentDeny | bit : currentDeny & ~bit;
    await ctx.gateway.putChannelOverwrite(channelId, ctx.guild.id, {
      type: 0,
      allow: allow.toString(),
      deny: deny.toString(),
      reason: ctx.auditReason,
    });
    const message = locked
      ? `Channel #${channel.name} locked (@everyone can't send messages).`
      : `Channel #${channel.name} unlocked.`;
    return { message, targetChannelId: channelId };
  };
}

/** Un handler por `ModActionType` — reemplaza el switch monolítico original. */
const MOD_ACTION_HANDLERS: Record<ModActionType, ModActionHandler> = {
  warn: handleWarn,
  kick: handleKick,
  ban: handleBan,
  unban: handleUnban,
  timeout: handleTimeout,
  untimeout: handleUntimeout,
  clearwarns: handleClearwarns,
  purge: handlePurge,
  slowmode: handleSlowmode,
  lock: makeLockHandler(true),
  unlock: makeLockHandler(false),
};

/** Acciones que envían DM de sanción antes de ejecutarse (`sendSanctionDm`). */
const DM_ACTIONS = new Set<ModActionType>(["warn", "kick", "timeout", "ban"]);

export async function executeModAction(
  gateway: BotGateway,
  input: ModActionRequest,
  actorUserId?: string,
): Promise<ModActionResponse> {
  const action = assertAction(input.action);
  const guild = await resolveGuild(gateway, input.guildId);
  const reason = (input.reason ?? "").trim();

  if (
    !reason &&
    action !== "purge" &&
    action !== "slowmode" &&
    action !== "unban" &&
    action !== "untimeout" &&
    action !== "lock" &&
    action !== "unlock" &&
    action !== "clearwarns"
  ) {
    throw new ModerationError("A reason is required.", 400, "MISSING_REASON");
  }

  const auditReason = reason.slice(0, 400) || "Action from Adobos panel";
  const moderatorId = actorUserId ?? "dashboard";

  try {
    await ensureGuildRow(guild.id);

    let dmResult = { dmSent: false, dmSkipped: true, dmFailed: false };
    if (DM_ACTIONS.has(action)) {
      const userId = assertSnowflake(input.userId ?? "", "userId");
      const botProfile = await gateway
        .getBotProfile(guild.id)
        .catch(() => null);
      dmResult = await sendSanctionDm({
        gateway,
        guildId: guild.id,
        guildName: guild.name,
        botUsername: botProfile?.username ?? "Adobos Bot",
        userId,
        action,
        reason: auditReason,
        dmMode: input.dmMode,
        dmText: input.dmText,
        templateId: input.templateId,
      });
    }

    const ctx: ModActionCtx = {
      gateway,
      guild,
      input,
      auditReason,
      moderatorId,
      actorUserId,
    };
    const {
      message: outcomeMessage,
      targetUserId,
      targetChannelId,
    } = await MOD_ACTION_HANDLERS[action](ctx);
    let message = outcomeMessage;

    await writeModLog({
      guildId: guild.id,
      action,
      targetUserId: targetUserId ?? null,
      targetChannelId: targetChannelId ?? null,
      moderatorId,
      reason: auditReason,
      meta: {
        dmMode: input.dmMode ?? "none",
        dmSent: dmResult.dmSent,
        dmFailed: dmResult.dmFailed,
      },
    });

    if (dmResult.dmFailed) {
      message = `${message} Sanction applied, but the user had DMs closed.`;
    }

    return {
      ok: true,
      action,
      message,
      dmSent: dmResult.dmSent,
      dmSkipped: dmResult.dmSkipped,
      dmFailed: dmResult.dmFailed,
    };
  } catch (error: unknown) {
    mapDiscordError(error);
  }
}

export async function fetchDiscordMessage(
  gateway: BotGateway,
  channelIdRaw: string,
  messageIdRaw: string,
  guildId?: string,
): Promise<ModFetchedMessageResponse> {
  const id = resolveGuildId(gateway, guildId);
  const channelId = assertSnowflake(channelIdRaw, "channelId");
  const messageId = assertSnowflake(messageIdRaw, "messageId");

  let msg: Awaited<ReturnType<BotGateway["fetchMessage"]>>;
  try {
    msg = await gateway.fetchMessage(id, channelId, messageId);
  } catch (error: unknown) {
    if (error instanceof BotGatewayError) {
      throw new ModerationError(error.message, error.status, error.code);
    }
    mapDiscordError(error);
  }

  const alreadyConfigured = Boolean(
    await one(
      getDb()
        .select({ id: autorolesRegistry.id })
        .from(autorolesRegistry)
        .where(
          and(
            eq(autorolesRegistry.guildId, id),
            eq(autorolesRegistry.messageId, msg.id),
          ),
        )
        .limit(1),
    ),
  );

  return {
    id: msg.id,
    channelId: msg.channelId,
    content: msg.content,
    embeds: msg.embeds,
    author: msg.author,
    isBotAuthor: msg.isBotAuthor,
    alreadyConfigured,
    reactions: msg.reactions,
  };
}
