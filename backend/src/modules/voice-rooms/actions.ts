import {
  canClaimVoiceRoom,
  clampVoiceBitrateKbps,
  clampVoiceUserLimit,
  sanitizeVoiceRoomName,
  type VoiceRoomAction,
  type VoiceRoomGenerator,
  type VoiceRoomLive,
} from "@adobos/shared";
import {
  ChannelType,
  type GuildMember,
  MessageFlags,
  type VoiceChannel,
} from "discord.js";
import {
  getGeneratorById,
  getRoomByChannel,
  getRoomByOwner,
  patchRoom,
  VoiceRoomsError,
} from "./domain/voice-rooms.js";
import {
  applyGhost,
  applyLock,
  assertCanControl,
  createInviteUrl,
  ensureTextChannel,
  fetchVoiceChannel,
  permitTarget,
  rejectTarget,
  setRoomBitrate,
  setRoomLimit,
  setRoomName,
  setRoomStatus,
  transferOwnerOverwrites,
} from "./rooms.js";

export interface VoiceActionInput {
  member: GuildMember;
  room: VoiceRoomLive;
  generator: VoiceRoomGenerator;
  channel: VoiceChannel;
  action: VoiceRoomAction | "unlock" | "unghost";
  name?: string;
  limit?: number;
  bitrate?: number;
  status?: string;
  targetUserId?: string | null;
  targetRoleId?: string | null;
  inviteMessage?: string;
}

function mappedAction(action: VoiceActionInput["action"]): VoiceRoomAction {
  if (action === "unlock") return "lock";
  if (action === "unghost") return "ghost";
  return action;
}

/** Contexto compartido que recibe cada handler — todo lo que `runVoiceRoomAction` ya tenía a mano. */
interface VoiceActionCtx {
  member: GuildMember;
  room: VoiceRoomLive;
  channel: VoiceChannel;
  input: VoiceActionInput;
}

type VoiceActionHandler = (ctx: VoiceActionCtx) => Promise<string>;

async function handleName(ctx: VoiceActionCtx): Promise<string> {
  const name = sanitizeVoiceRoomName(ctx.input.name ?? "");
  await setRoomName(ctx.channel, name);
  return `Name: **${name}**.`;
}

async function handleLimit(ctx: VoiceActionCtx): Promise<string> {
  const limit = clampVoiceUserLimit(ctx.input.limit ?? 0);
  await setRoomLimit(ctx.channel, limit);
  return limit === 0 ? "No user limit." : `Limit: **${limit}**.`;
}

function makeLockHandler(locked: boolean): VoiceActionHandler {
  return async (ctx) => {
    await applyLock(ctx.channel, locked);
    await patchRoom(ctx.room.channelId, { locked });
    return locked
      ? "Room locked. No one new enters except via permit."
      : "Room unlocked.";
  };
}

function makeGhostHandler(ghosted: boolean): VoiceActionHandler {
  return async (ctx) => {
    await applyGhost(ctx.channel, ghosted);
    await patchRoom(ctx.room.channelId, { ghosted });
    return ghosted ? "Room hidden (ghost)." : "Room visible again.";
  };
}

async function handleBitrate(ctx: VoiceActionCtx): Promise<string> {
  const kbps = clampVoiceBitrateKbps(
    ctx.input.bitrate ?? 64,
    ctx.channel.guild.maximumBitrate,
  );
  await setRoomBitrate(ctx.channel, kbps);
  return `Bitrate: **${kbps} kbps**.`;
}

async function handleStatus(ctx: VoiceActionCtx): Promise<string> {
  const status = (ctx.input.status ?? "").trim();
  if (!status) {
    throw new VoiceRoomsError("Type a status.", 400, "INVALID_STATUS");
  }
  await setRoomStatus(ctx.channel, status);
  return "Status updated.";
}

async function handleText(ctx: VoiceActionCtx): Promise<string> {
  if (ctx.room.textChannelId) {
    return `Text channel already exists: <#${ctx.room.textChannelId}>.`;
  }
  const textId = await ensureTextChannel(
    ctx.channel.guild,
    ctx.channel,
    ctx.member,
  );
  await patchRoom(ctx.room.channelId, { textChannelId: textId });
  return `Text channel: <#${textId}>.`;
}

async function handlePermit(ctx: VoiceActionCtx): Promise<string> {
  const userId = ctx.input.targetUserId ?? null;
  const roleId = ctx.input.targetRoleId ?? null;
  if (!userId && !roleId) {
    throw new VoiceRoomsError(
      "Mention a user or a role.",
      400,
      "MISSING_TARGET",
    );
  }
  if (userId) await permitTarget(ctx.channel, userId);
  if (roleId) await permitTarget(ctx.channel, roleId);
  return "Permitted.";
}

async function handleReject(ctx: VoiceActionCtx): Promise<string> {
  const userId = ctx.input.targetUserId ?? null;
  const roleId = ctx.input.targetRoleId ?? null;
  if (!userId && !roleId) {
    throw new VoiceRoomsError(
      "Mention a user or a role.",
      400,
      "MISSING_TARGET",
    );
  }
  if (userId) await rejectTarget(ctx.channel, userId, false);
  if (roleId) await rejectTarget(ctx.channel, roleId, true);
  return "Rejected.";
}

async function handleTransfer(ctx: VoiceActionCtx): Promise<string> {
  const toId = ctx.input.targetUserId;
  if (!toId) {
    throw new VoiceRoomsError("Choose the new owner.", 400, "MISSING_TARGET");
  }
  if (toId === ctx.room.ownerId) {
    throw new VoiceRoomsError(
      "They are already the owner.",
      400,
      "ALREADY_OWNER",
    );
  }
  if (!ctx.channel.members.has(toId)) {
    throw new VoiceRoomsError(
      "The new owner has to be in the room.",
      400,
      "NOT_IN_ROOM",
    );
  }
  const occupied = await getRoomByOwner(ctx.room.guildId, toId);
  if (occupied) {
    throw new VoiceRoomsError(
      "That person already has a room.",
      400,
      "ALREADY_HAS_ROOM",
    );
  }
  await transferOwnerOverwrites(ctx.channel, ctx.room.ownerId, toId);
  await patchRoom(ctx.room.channelId, { ownerId: toId });
  return `Owner: <@${toId}>.`;
}

async function handleInvite(ctx: VoiceActionCtx): Promise<string> {
  const toId = ctx.input.targetUserId;
  if (!toId) {
    throw new VoiceRoomsError("Choose who to invite.", 400, "MISSING_TARGET");
  }
  const url = await createInviteUrl(ctx.channel);
  const note = ctx.input.inviteMessage?.trim();
  const body = note
    ? `${note}\n${url}`
    : `You were invited to a voice room: ${url}`;
  const user = await ctx.member.client.users.fetch(toId).catch(() => null);
  if (user) {
    const dm = await user.send(body).catch(() => null);
    if (dm) return `Invite sent to <@${toId}>.`;
  }
  return `I couldn't send a DM. Link: ${url}`;
}

/**
 * Un handler por acción (excepto `claim`, que se resuelve antes de llegar
 * acá porque necesita `assertCanControl` con la acción YA mapeada y una
 * validación extra sobre quién está presente en el canal).
 */
const VOICE_ACTION_HANDLERS: Partial<
  Record<VoiceActionInput["action"], VoiceActionHandler>
> = {
  name: handleName,
  limit: handleLimit,
  lock: makeLockHandler(true),
  unlock: makeLockHandler(false),
  ghost: makeGhostHandler(true),
  unghost: makeGhostHandler(false),
  bitrate: handleBitrate,
  status: handleStatus,
  text: handleText,
  permit: handlePermit,
  reject: handleReject,
  transfer: handleTransfer,
  invite: handleInvite,
};

export async function runVoiceRoomAction(
  input: VoiceActionInput,
): Promise<string> {
  const action = mappedAction(input.action);
  const { member, room, generator, channel } = input;
  assertCanControl(member, room, action, generator.allowedActions);

  if (action === "claim") {
    const ownerIn = channel.members.has(room.ownerId);
    if (
      !canClaimVoiceRoom({
        ownerId: room.ownerId,
        actorId: member.id,
        ownerInChannel: ownerIn,
      })
    ) {
      throw new VoiceRoomsError(
        "The owner is still in the room.",
        400,
        "OWNER_PRESENT",
      );
    }
    if (!channel.members.has(member.id)) {
      throw new VoiceRoomsError(
        "You have to be in the room to claim it.",
        400,
        "NOT_IN_ROOM",
      );
    }
    await transferOwnerOverwrites(channel, room.ownerId, member.id);
    await patchRoom(room.channelId, { ownerId: member.id });
    return "You are now the room owner.";
  }

  const handler = VOICE_ACTION_HANDLERS[input.action];
  if (!handler) {
    throw new VoiceRoomsError("Unknown action.", 400, "UNKNOWN_ACTION");
  }
  return handler({ member, room, channel, input });
}

export async function loadRoomContext(member: GuildMember): Promise<{
  room: VoiceRoomLive;
  generator: VoiceRoomGenerator;
  channel: VoiceChannel;
}> {
  const voice = member.voice.channel;
  if (!voice || voice.type !== ChannelType.GuildVoice) {
    throw new VoiceRoomsError(
      "Join your voice room first.",
      400,
      "NOT_IN_VOICE",
    );
  }
  const room = await getRoomByChannel(voice.id);
  if (!room) {
    throw new VoiceRoomsError(
      "This is not a Voice Rooms room.",
      400,
      "NOT_A_ROOM",
    );
  }
  const generator = await getGeneratorById(room.generatorId, room.guildId);
  const channel = await fetchVoiceChannel(member.guild, room.channelId);
  if (!channel) {
    throw new VoiceRoomsError("The room no longer exists.", 404, "ROOM_GONE");
  }
  return { room, generator, channel };
}

export const EPHEMERAL = { flags: MessageFlags.Ephemeral } as const;
