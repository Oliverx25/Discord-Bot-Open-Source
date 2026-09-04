import type { LockdownOverwriteSnapshot } from "@adobos/shared";
import { PermissionFlagsBits } from "discord.js";
import type { BotGateway } from "#core/discord/botGateway.js";
import { logger } from "#core/log.js";
import {
  getAntiRaidSettings,
  getLockdownSnapshot,
  setLockdownState,
} from "./domain/anti-raid.js";

/** Permisos que se deniegan a @everyone durante el lockdown. */
const LOCK_BITS =
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.AddReactions |
  PermissionFlagsBits.SendMessagesInThreads |
  PermissionFlagsBits.CreatePublicThreads |
  PermissionFlagsBits.CreatePrivateThreads |
  PermissionFlagsBits.Connect |
  PermissionFlagsBits.Speak;

/** `ChannelType`: text, announcement, voice, stage. */
const LOCKABLE_TYPES = new Set([0, 5, 2, 13]);

export async function applyGuildLockdown(
  gateway: BotGateway,
  guildId: string,
  byUserId: string | null,
): Promise<{ channels: number }> {
  const current = await getAntiRaidSettings(guildId);
  if (current.lockdownActive) return { channels: 0 };

  await setLockdownState({
    guildId,
    active: true,
    byUserId,
    snapshot: [],
  });

  const everyoneId = guildId;
  const snapshot: LockdownOverwriteSnapshot[] = [];
  let channels = 0;

  for (const channel of await gateway.listChannels(guildId)) {
    if (!LOCKABLE_TYPES.has(channel.type)) continue;
    const overwrites = await gateway.getChannelOverwrites(guildId, channel.id);
    if (!overwrites) continue;

    const existing = overwrites.find((o) => o.id === everyoneId);
    snapshot.push({
      channelId: channel.id,
      existed: Boolean(existing),
      allow: existing?.allow ?? "0",
      deny: existing?.deny ?? "0",
    });

    const nextAllow = BigInt(existing?.allow ?? "0") & ~LOCK_BITS;
    const nextDeny = BigInt(existing?.deny ?? "0") | LOCK_BITS;
    try {
      await gateway.putChannelOverwrite(channel.id, everyoneId, {
        type: 0,
        allow: nextAllow.toString(),
        deny: nextDeny.toString(),
        reason: "Anti-Raid lockdown",
      });
      channels += 1;
    } catch (error: unknown) {
      logger.warn(
        { err: error, channelId: channel.id },
        "anti-raid: couldn't lock channel",
      );
    }
  }

  await setLockdownState({
    guildId,
    active: true,
    byUserId,
    snapshot,
  });
  return { channels };
}

export async function liftGuildLockdown(
  gateway: BotGateway,
  guildId: string,
): Promise<{ channels: number }> {
  const snapshot = await getLockdownSnapshot(guildId);
  const everyoneId = guildId;
  let channels = 0;

  for (const item of snapshot) {
    const overwrites = await gateway.getChannelOverwrites(
      guildId,
      item.channelId,
    );
    if (!overwrites) continue;
    try {
      const rest = overwrites.filter((o) => o.id !== everyoneId);
      if (item.existed) {
        rest.push({
          id: everyoneId,
          type: 0,
          allow: item.allow || "0",
          deny: item.deny || "0",
        });
      }
      await gateway.setChannelOverwrites(
        item.channelId,
        rest,
        "Anti-Raid unlock",
      );
      channels += 1;
    } catch (error: unknown) {
      logger.warn(
        { err: error, channelId: item.channelId },
        "anti-raid: couldn't restore channel",
      );
    }
  }

  await setLockdownState({
    guildId,
    active: false,
    byUserId: null,
    snapshot: [],
  });
  return { channels };
}
