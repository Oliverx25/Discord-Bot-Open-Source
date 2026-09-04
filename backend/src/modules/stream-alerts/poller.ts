import type { StreamAlert, StreamLiveSnapshot } from "@adobos/shared";
import {
  renderStreamAlertTemplate,
  STREAM_ALERT_EMBED_COLOR,
  STREAM_ALERT_PLATFORM_LABEL,
  shouldAnnounceLive,
  shouldPollStreamAlert,
  streamAlertMentionPrefix,
} from "@adobos/shared";
import { ChannelType, EmbedBuilder } from "discord.js";
import type { BotGateway } from "#core/discord/botGateway.js";
import { logger } from "#core/log.js";
import {
  applyStreamLiveState,
  listEnabledStreamAlerts,
  touchStreamAlertChecked,
} from "./domain/stream-alerts.js";
import {
  fetchKickLive,
  fetchTwitchLiveMap,
  fetchYouTubeLive,
  offlineSnapshot,
} from "./providers.js";

let botGateway: BotGateway | null = null;
const inFlight = new Set<number>();

export function bindStreamAlertsPoller(gateway: BotGateway): void {
  botGateway = gateway;
}

/** Tipos de canal a los que NO se puede anunciar. */
const NON_SENDABLE = new Set<number>([
  ChannelType.GuildVoice,
  ChannelType.GuildStageVoice,
  ChannelType.GuildCategory,
  ChannelType.GuildForum,
  ChannelType.GuildMedia,
]);

async function announce(
  gateway: BotGateway,
  alert: StreamAlert,
  snapshot: StreamLiveSnapshot,
): Promise<boolean> {
  try {
    const channel = await gateway
      .getChannel(alert.guildId, alert.discordChannelId)
      .catch(() => undefined);
    if (channel && NON_SENDABLE.has(channel.type)) return false;

    const name = snapshot.displayName || alert.displayName || alert.handle;
    const title = snapshot.title || "En directo";
    const url = snapshot.url ?? "";
    const game = snapshot.game || "";
    const body = renderStreamAlertTemplate(alert.template, {
      name,
      title,
      url,
      game,
      handle: alert.handle,
      platform: STREAM_ALERT_PLATFORM_LABEL[alert.platform],
    });
    const mention = streamAlertMentionPrefix(alert.mentionRoleId);
    const embed = new EmbedBuilder()
      .setColor(STREAM_ALERT_EMBED_COLOR[alert.platform])
      .setTitle(title.slice(0, 256))
      .setAuthor({ name: name.slice(0, 256) });
    if (url) embed.setURL(url);
    if (game) embed.setDescription(`Jugando a ${game}`.slice(0, 4096));
    if (snapshot.thumbnailUrl) embed.setThumbnail(snapshot.thumbnailUrl);

    await gateway.sendMessage(alert.guildId, alert.discordChannelId, {
      content: `${mention}${body}`.trim() || undefined,
      embeds: [embed.toJSON()],
      allowedMentions: alert.mentionRoleId
        ? { roles: [alert.mentionRoleId], parse: [] }
        : { parse: [] },
    });
    return true;
  } catch (error: unknown) {
    logger.warn(
      { err: error, id: alert.id },
      "stream-alerts: couldn't publish",
    );
    return false;
  }
}

async function applySnapshot(
  gateway: BotGateway,
  alert: StreamAlert,
  snapshot: StreamLiveSnapshot,
): Promise<boolean> {
  const announceNow = shouldAnnounceLive({
    isLive: snapshot.isLive,
    previousLiveId: alert.liveId,
    liveId: snapshot.liveId,
  });
  let announced = false;
  if (announceNow) {
    announced = await announce(gateway, alert, snapshot);
  }
  if (announceNow && !announced) {
    await touchStreamAlertChecked(alert.id);
    return false;
  }
  await applyStreamLiveState(alert.id, snapshot, { announced });
  return announced;
}

export async function processStreamAlerts(nowMs = Date.now()): Promise<number> {
  const gateway = botGateway;
  if (!gateway?.isReady()) return 0;

  const alerts = await listEnabledStreamAlerts();
  const due = alerts.filter((alert) => {
    if (inFlight.has(alert.id)) return false;
    return shouldPollStreamAlert({
      platform: alert.platform,
      lastCheckedAt: alert.lastCheckedAt,
      nowMs,
    });
  });
  if (due.length === 0) return 0;

  const twitchDue = due.filter((a) => a.platform === "twitch");
  const twitchLogins = [...new Set(twitchDue.map((a) => a.handle))];
  const twitchResult = await fetchTwitchLiveMap(twitchLogins);

  let announced = 0;
  for (const alert of due) {
    inFlight.add(alert.id);
    try {
      let snapshot: StreamLiveSnapshot | null = null;
      if (alert.platform === "twitch") {
        if (!twitchResult.ok) {
          await touchStreamAlertChecked(alert.id);
          continue;
        }
        snapshot =
          twitchResult.map.get(alert.handle) ??
          offlineSnapshot("twitch", alert.handle);
      } else if (alert.platform === "kick") {
        snapshot = await fetchKickLive(alert.handle);
      } else {
        snapshot = await fetchYouTubeLive(alert.handle);
      }
      if (!snapshot) {
        await touchStreamAlertChecked(alert.id);
        continue;
      }
      if (await applySnapshot(gateway, alert, snapshot)) announced += 1;
    } catch (error: unknown) {
      logger.warn({ err: error, id: alert.id }, "stream-alerts: tick failed");
      await touchStreamAlertChecked(alert.id).catch(() => undefined);
    } finally {
      inFlight.delete(alert.id);
    }
  }
  return announced;
}
