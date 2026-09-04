import { applyLevelsTokens, embedColorToInt } from "@adobos/shared";
import { ChannelType, EmbedBuilder } from "discord.js";
import type { BotGateway } from "#core/discord/botGateway.js";
import { registerJob } from "#core/lifecycle.js";
import { logger } from "#core/log.js";
import {
  getLeaderboardTotal,
  getLevelsConfigCached,
  getTopUserXpRows,
  setLiveLeaderboardMessageId,
  topFingerprint,
} from "./domain/levels.js";

/** Debounce tras un cambio de Top 10. */
const DEBOUNCE_MS = 45_000;
/** Intervalo mínimo entre edits (anti rate-limit). */
const MIN_EDIT_INTERVAL_MS = 5 * 60_000;

const dirtyGuilds = new Set<string>();
const lastFingerprint = new Map<string, string>();
const lastEditAt = new Map<string, number>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
let flushIntervalStarted = false;

function medals(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `**#${rank}**`;
}

export async function buildLiveLeaderboardEmbed(
  gateway: BotGateway,
  guildId: string,
): Promise<EmbedBuilder> {
  const rows = await getTopUserXpRows(guildId, 10);
  const names = await gateway.resolveMembers(
    guildId,
    rows.map((row) => row.userId),
  );
  const lines = rows.map((row, index) => {
    const rank = index + 1;
    const name = names.get(row.userId)?.displayName ?? row.userId;
    return `${medals(rank)} | <@${row.userId}> | ${name} | Level **${row.level}** | \`${row.xp.toLocaleString("es-MX")} XP\``;
  });

  const config = await getLevelsConfigCached(guildId);
  const total = await getLeaderboardTotal(guildId);
  const intro = applyLevelsTokens(config.leaderboardEmbedDescription, {
    "{total}": String(total),
  }).trim();
  const ranking =
    lines.length > 0 ? lines.join("\n") : "_No users with XP yet._";
  const description = [intro, ranking]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4096);

  const embed = new EmbedBuilder()
    .setColor(embedColorToInt(config.leaderboardEmbedColor, 0xca7aff))
    .setTitle((config.leaderboardEmbedTitle || "Leaderboard").slice(0, 256))
    .setDescription(description)
    .setFooter({ text: "Auto-updated · Levels" })
    .setTimestamp(new Date());

  if (config.leaderboardShowThumbnail) {
    const guild = await gateway.getGuild(guildId);
    if (guild?.iconUrl) embed.setThumbnail(guild.iconUrl);
  }

  return embed;
}

async function flushLiveLeaderboard(
  gateway: BotGateway,
  guildId: string,
): Promise<void> {
  if (!dirtyGuilds.has(guildId)) return;

  const now = Date.now();
  const last = lastEditAt.get(guildId) ?? 0;
  if (last > 0 && now - last < MIN_EDIT_INTERVAL_MS) {
    const wait = MIN_EDIT_INTERVAL_MS - (now - last);
    clearTimeout(debounceTimers.get(guildId));
    debounceTimers.set(
      guildId,
      setTimeout(() => {
        void flushLiveLeaderboard(gateway, guildId);
      }, wait),
    );
    return;
  }

  const config = await getLevelsConfigCached(guildId);
  if (!config.enabled || !config.liveLeaderboardChannelId) {
    dirtyGuilds.delete(guildId);
    return;
  }

  const channel = await gateway.getChannel(
    guildId,
    config.liveLeaderboardChannelId,
  );
  if (
    !channel ||
    (channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement)
  ) {
    dirtyGuilds.delete(guildId);
    return;
  }

  const embed = await buildLiveLeaderboardEmbed(gateway, guildId);
  const rows = await getTopUserXpRows(guildId, 10);
  const fp = topFingerprint(rows);
  const payload = { embeds: [embed.toJSON()] };

  try {
    let messageId = config.liveLeaderboardMessageId;
    if (messageId) {
      const { orphaned } = await gateway.editMessage(
        guildId,
        config.liveLeaderboardChannelId,
        messageId,
        payload,
      );
      if (orphaned) messageId = null;
    }
    if (!messageId) {
      const sent = await gateway.sendMessage(
        guildId,
        config.liveLeaderboardChannelId,
        payload,
      );
      await setLiveLeaderboardMessageId(guildId, sent.messageId);
    }

    lastFingerprint.set(guildId, fp);
    lastEditAt.set(guildId, Date.now());
    dirtyGuilds.delete(guildId);
  } catch (error) {
    logger.warn(
      { err: error },
      `levels: couldn't update the live leaderboard (${guildId}):`,
    );
  }
}

/**
 * Tras ganar XP: solo marca dirty si el Top 10 cambia.
 * El edit real va con debounce + intervalo mínimo de 5 min.
 */
export async function scheduleLiveLeaderboardRefresh(
  gateway: BotGateway,
  guildId: string,
): Promise<void> {
  const config = await getLevelsConfigCached(guildId);
  if (!config.enabled || !config.liveLeaderboardChannelId) return;

  const rows = await getTopUserXpRows(guildId, 10);
  const fp = topFingerprint(rows);
  const prev = lastFingerprint.get(guildId);
  if (prev !== undefined && prev === fp) return;

  if (prev === undefined) {
    lastFingerprint.set(guildId, fp);
  }

  dirtyGuilds.add(guildId);

  clearTimeout(debounceTimers.get(guildId));
  debounceTimers.set(
    guildId,
    setTimeout(() => {
      void flushLiveLeaderboard(gateway, guildId);
    }, DEBOUNCE_MS),
  );

  ensureFlushInterval(gateway);
}

/** Fuerza un refresh inmediato (p. ej. al cambiar el canal en el dashboard). */
export async function forceLiveLeaderboardRefresh(
  gateway: BotGateway,
  guildId: string,
): Promise<void> {
  dirtyGuilds.add(guildId);
  lastEditAt.delete(guildId);
  clearTimeout(debounceTimers.get(guildId));
  await flushLiveLeaderboard(gateway, guildId);
}

function ensureFlushInterval(gateway: BotGateway): void {
  if (flushIntervalStarted) return;
  flushIntervalStarted = true;
  const timer = setInterval(() => {
    for (const guildId of [...dirtyGuilds]) {
      void flushLiveLeaderboard(gateway, guildId);
    }
  }, MIN_EDIT_INTERVAL_MS);
  registerJob("levels:live-leaderboard-flush", timer);
}
