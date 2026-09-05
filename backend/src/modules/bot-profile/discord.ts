import fs from "node:fs";
import type {
  BotActivityTypeName,
  BotGuildProfileResponse,
  BotPresenceStatus,
  UpdateBotGuildProfileRequest,
  UpdateBotGuildProfileResponse,
} from "@adobos/shared";
import {
  BOT_GUILD_NICKNAME_MAX,
  isBotGuildNicknameTooLong,
  parseBotActivityType,
  parseBotPresenceStatus,
} from "@adobos/shared";
import {
  type ActivitiesOptions,
  type ActivityType,
  type Client,
  DiscordAPIError,
  type PresenceStatusData,
  PresenceUpdateStatus,
} from "discord.js";
import { eq } from "drizzle-orm";
import type { BotGateway } from "#core/discord/botGateway.js";
import { BotGatewayError } from "#core/discord/botGateway.js";
import { logger } from "#core/log.js";
import { getDb, one } from "#db/client.js";
import { botPresenceSettings } from "#db/schema.js";
import {
  resolvePublicUploadPath,
  uploadBelongsToGuild,
} from "#lib/dataPaths.js";

export class BotProfileError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "BotProfileError";
  }
}

const PRESENCE_ROW_ID = "default";

interface PersistedPresence {
  status: BotPresenceStatus;
  activityType: BotActivityTypeName;
  activityName: string;
  streamUrl: string | null;
  state: string;
}

const STATUS_TO_DJS: Record<BotPresenceStatus, PresenceStatusData> = {
  online: PresenceUpdateStatus.Online,
  idle: PresenceUpdateStatus.Idle,
  dnd: PresenceUpdateStatus.DoNotDisturb,
  invisible: PresenceUpdateStatus.Invisible,
};

const ACTIVITY_TYPE_MAP: Record<BotActivityTypeName, number> = {
  Playing: 0,
  Streaming: 1,
  Listening: 2,
  Watching: 3,
  Custom: 4,
  Competing: 5,
};

function resolveGuildId(gateway: BotGateway, guildId?: string): string {
  if (!gateway.isReady()) {
    throw new BotProfileError(
      "The Discord bot is not connected.",
      503,
      "BOT_NOT_READY",
    );
  }
  const id = (guildId ?? "").trim();
  if (!id) {
    throw new BotProfileError("Missing guildId.", 400, "MISSING_GUILD_ID");
  }
  return id;
}

function toProfileResponse(
  summary: Awaited<ReturnType<BotGateway["getBotProfile"]>>,
): BotGuildProfileResponse {
  return {
    guildId: summary.guildId,
    guildName: summary.guildName,
    nickname: summary.nickname,
    displayName: summary.displayName,
    username: summary.username,
    tag: summary.tag,
    serverAvatarURL: summary.serverAvatarUrl,
    globalAvatarURL: summary.globalAvatarUrl,
    hasServerAvatar: summary.hasServerAvatar,
  };
}

async function fetchProfile(
  gateway: BotGateway,
  guildId: string,
): Promise<BotGuildProfileResponse> {
  try {
    return toProfileResponse(await gateway.getBotProfile(guildId));
  } catch (error) {
    if (error instanceof BotGatewayError && error.code === "GUILD_NOT_FOUND") {
      throw new BotProfileError(
        "The bot is not in that server.",
        404,
        "GUILD_NOT_FOUND",
      );
    }
    throw error;
  }
}

export async function readPersistedPresence(): Promise<PersistedPresence | null> {
  const db = getDb();
  const row = await one(
    db
      .select()
      .from(botPresenceSettings)
      .where(eq(botPresenceSettings.id, PRESENCE_ROW_ID))
      .limit(1),
  );

  if (!row) return null;

  return {
    status: parseBotPresenceStatus(row.status),
    activityType: parseBotActivityType(row.activityType),
    activityName: row.activityName ?? "",
    streamUrl: row.streamUrl,
    state: row.state ?? "",
  };
}

function buildActivities(data: PersistedPresence): ActivitiesOptions[] {
  const activityName = data.activityName.trim();
  if (!activityName) return [];

  const type = data.activityType;
  const state = data.state.trim() || undefined;

  if (type === "Streaming" && data.streamUrl) {
    return [
      {
        name: activityName.slice(0, 128),
        type: ACTIVITY_TYPE_MAP.Streaming as ActivityType,
        url: data.streamUrl,
        state,
      },
    ];
  }

  if (type === "Custom") {
    return [
      {
        name: "Custom Status",
        type: ACTIVITY_TYPE_MAP.Custom as ActivityType,
        state: activityName.slice(0, 128),
      },
    ];
  }

  return [
    {
      name: activityName.slice(0, 128),
      type: ACTIVITY_TYPE_MAP[type] as ActivityType,
      state,
    },
  ];
}

/** Reaplica presencia guardada tras `ready` / reinicio (sin UI global). */
export async function restorePersistedPresence(bot: Client): Promise<void> {
  try {
    if (!bot.isReady() || !bot.user) return;
    const saved = await readPersistedPresence();
    if (!saved) {
      logger.info("No persisted presence; skipping restore.");
      return;
    }
    bot.user.setPresence({
      status: STATUS_TO_DJS[saved.status],
      activities: buildActivities(saved),
    });
    logger.info(
      `Presence restored: ${saved.status} / ${saved.activityType} "${saved.activityName}"`,
    );
  } catch (error: unknown) {
    logger.error({ err: error }, "Couldn't restore the presence:");
  }
}

export async function getGuildBotProfile(
  gateway: BotGateway,
  guildId?: string,
): Promise<BotGuildProfileResponse> {
  const id = resolveGuildId(gateway, guildId);
  return fetchProfile(gateway, id);
}

/** @deprecated alias */
export async function getBotProfile(
  gateway: BotGateway,
  guildId?: string,
): Promise<BotGuildProfileResponse> {
  return await getGuildBotProfile(gateway, guildId);
}

function mapDiscordError(error: unknown): never {
  if (error instanceof BotProfileError) throw error;

  if (error instanceof DiscordAPIError) {
    const msg = String(error.message ?? "");
    if (
      error.code === 50013 ||
      error.status === 403 ||
      /missing.?access|missing.?permissions|privilege/i.test(msg)
    ) {
      throw new BotProfileError(
        "The bot lacks sufficient permissions in this server to change its nickname or avatar.",
        403,
        "MISSING_PERMISSIONS",
      );
    }

    if (error.status === 400 || error.code === 50035) {
      throw new BotProfileError(
        msg || "Discord rejected the server profile data.",
        400,
        "DISCORD_INVALID",
      );
    }

    throw new BotProfileError(
      msg || "Discord rejected the server profile update.",
      typeof error.status === "number" && error.status >= 400
        ? error.status
        : 502,
      "DISCORD_API_ERROR",
    );
  }

  throw error;
}

/**
 * Resuelve avatar a Buffer / URL / null (limpiar) / undefined (sin cambio).
 */
async function resolveServerAvatarInput(options: {
  guildId: string;
  clear?: boolean;
  fileBuffer?: Buffer;
  urlOrPath?: string | null;
}): Promise<Buffer | string | null | undefined> {
  if (options.clear) return null;
  if (options.fileBuffer && options.fileBuffer.length > 0) {
    return options.fileBuffer;
  }

  const raw = options.urlOrPath?.trim();
  if (!raw) return undefined;

  if (raw.startsWith("/uploads/")) {
    // TEN-01: el path por sí solo no prueba que el upload sea de ESTE guild
    // — sin este chequeo, el guild A podía poner como avatar de servidor un
    // upload ya existente del guild B.
    if (!uploadBelongsToGuild(raw, options.guildId)) {
      throw new BotProfileError(
        "The uploaded avatar image was not found.",
        400,
        "AVATAR_FILE_MISSING",
      );
    }
    const absolute = resolvePublicUploadPath(raw);
    if (!absolute || !fs.existsSync(absolute)) {
      throw new BotProfileError(
        "The uploaded avatar image was not found.",
        400,
        "AVATAR_FILE_MISSING",
      );
    }
    return fs.readFileSync(absolute);
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  throw new BotProfileError(
    "serverAvatarUrl must be http(s) or a /uploads/… path",
    400,
    "INVALID_AVATAR_URL",
  );
}

export interface UpdateGuildBotProfileOptions {
  fields: UpdateBotGuildProfileRequest;
  avatarBuffer?: Buffer;
  guildId?: string;
}

export async function updateGuildBotProfile(
  gateway: BotGateway,
  options: UpdateGuildBotProfileOptions,
): Promise<UpdateBotGuildProfileResponse> {
  const id = resolveGuildId(gateway, options.guildId);
  const before = await fetchProfile(gateway, id);
  const { fields, avatarBuffer } = options;

  const changedFlags = {
    nickname: false,
    serverAvatar: false,
  };

  try {
    const clearNickname = fields.clearNickname === true;
    const nicknameRaw = fields.nickname;
    const shouldUpdateNickname = clearNickname || nicknameRaw !== undefined;

    if (shouldUpdateNickname) {
      const nextNick = clearNickname
        ? null
        : typeof nicknameRaw === "string"
          ? nicknameRaw.trim() || null
          : null;

      if (nextNick && isBotGuildNicknameTooLong(nextNick)) {
        throw new BotProfileError(
          `The nickname must be at most ${BOT_GUILD_NICKNAME_MAX} characters.`,
          400,
          "INVALID_NICKNAME",
        );
      }

      const current = before.nickname || null;
      if (current !== nextNick) {
        await gateway.setBotGuildNickname(id, nextNick);
        changedFlags.nickname = true;
      }
    }

    const avatarInput = await resolveServerAvatarInput({
      guildId: id,
      clear: fields.clearServerAvatar === true,
      fileBuffer: avatarBuffer,
      urlOrPath: fields.serverAvatarUrl,
    });

    if (avatarInput !== undefined) {
      await gateway.setBotGuildAvatar(id, avatarInput);
      changedFlags.serverAvatar = true;
    }
  } catch (error: unknown) {
    mapDiscordError(error);
  }

  const profile = await fetchProfile(gateway, id);

  return {
    ok: true,
    message: "Bot profile updated for this server",
    profile,
    changed: changedFlags,
  };
}

/** @deprecated alias */
export async function updateBotProfile(
  gateway: BotGateway,
  options: UpdateGuildBotProfileOptions,
): Promise<UpdateBotGuildProfileResponse> {
  return await updateGuildBotProfile(gateway, options);
}
