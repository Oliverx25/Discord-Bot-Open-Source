import type {
  AutoDeleteConfig,
  AutoDeleteFilterType,
  AutoDeleteRule,
} from "@adobos/shared";
import {
  isOlderThanBulkWindow,
  messageMatchesAutoDeleteFilter,
  normalizeScheduledTimezone,
} from "@adobos/shared";
import { ChannelType } from "discord.js";
import type { BotGateway, ChannelSummary } from "#core/discord/botGateway.js";
import { logger } from "#core/log.js";
import {
  clockPartsInZone,
  isDailyScheduleDue,
} from "#lib/schedulerTimezone.js";
import { rememberBotMessageDeletes } from "#modules/action-logs/audit.js";
import { listAllAutoDeleteConfigs } from "./domain/auto-delete.js";

const MAX_PAGES = 25;
const PAUSE_MS = 350;

interface ScheduledEntry {
  guildId: string;
  rule: AutoDeleteRule;
  timezone: string;
}

/** guildId → reglas SCHEDULED activas (reemplaza los cron tasks de node-cron). */
const scheduledRules = new Map<string, ScheduledEntry[]>();
/** `${guildId}:${channelId}` → último minuto (stamp de su zona) ya disparado. */
const lastFired = new Map<string, string>();

let botGateway: BotGateway | null = null;

export function bindAutoDeleteScheduler(gateway: BotGateway): void {
  botGateway = gateway;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SWEEPABLE_PARENT = new Set<number>([
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildForum,
  ChannelType.GuildMedia,
]);

/** Barrido paginado de un canal/hilo por REST. */
async function sweepChannel(
  gateway: BotGateway,
  guildId: string,
  channelId: string,
  filterType: AutoDeleteFilterType,
): Promise<void> {
  let before: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const fetched = await gateway
      .listChannelMessages(channelId, { limit: 100, before })
      .catch(
        () => [] as Awaited<ReturnType<BotGateway["listChannelMessages"]>>,
      );
    if (fetched.length === 0) break;

    const sorted = [...fetched].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
    before = sorted[0]?.id;

    const matching = fetched.filter((msg) =>
      messageMatchesAutoDeleteFilter(
        {
          pinned: msg.pinned,
          authorIsBot: msg.authorIsBot,
          hasAttachments: msg.attachmentCount > 0,
          createdTimestamp: Date.parse(msg.createdAt),
        },
        filterType,
      ),
    );
    const young = matching.filter(
      (msg) => !isOlderThanBulkWindow(Date.parse(msg.createdAt)),
    );
    const old = matching.filter((msg) =>
      isOlderThanBulkWindow(Date.parse(msg.createdAt)),
    );

    if (young.length > 0) {
      const ids = young.map((m) => m.id);
      await rememberBotMessageDeletes(guildId, ids);
      await gateway.bulkDeleteMessageIds(channelId, ids).catch((error) => {
        logger.warn(
          { err: error },
          `auto-delete: bulkDelete failed (${channelId}):`,
        );
      });
      await sleep(PAUSE_MS);
    }

    for (const msg of old) {
      await rememberBotMessageDeletes(guildId, [msg.id]);
      await gateway
        .deleteMessage(guildId, channelId, msg.id)
        .catch(() => undefined);
    }
    if (old.length > 0) await sleep(PAUSE_MS);

    if (fetched.length < 100) break;
  }
}

async function sweepChannelAndThreads(
  gateway: BotGateway,
  guildId: string,
  channel: ChannelSummary,
  filterType: AutoDeleteFilterType,
): Promise<void> {
  if (
    channel.type === ChannelType.GuildText ||
    channel.type === ChannelType.GuildAnnouncement
  ) {
    await sweepChannel(gateway, guildId, channel.id, filterType);
  }

  const threads = await gateway
    .listActiveThreads(guildId)
    .catch(() => [] as Awaited<ReturnType<BotGateway["listActiveThreads"]>>);
  for (const thread of threads.filter((t) => t.parentId === channel.id)) {
    await sweepChannel(gateway, guildId, thread.id, filterType);
    await sleep(PAUSE_MS);
  }
}

async function runScheduledCleanup(
  gateway: BotGateway,
  guildId: string,
  rule: AutoDeleteRule,
): Promise<void> {
  try {
    const channel = await gateway
      .getChannel(guildId, rule.channelId)
      .catch(() => null);
    if (!channel || !SWEEPABLE_PARENT.has(channel.type)) return;
    await sweepChannelAndThreads(gateway, guildId, channel, rule.filterType);
  } catch (error) {
    logger.warn(
      { err: error },
      `auto-delete: scheduled cleanup failed (${guildId}/${rule.channelId}):`,
    );
  }
}

export function stopAutoDeleteJobsForGuild(guildId: string): void {
  scheduledRules.delete(guildId);
  for (const key of [...lastFired.keys()]) {
    if (key.startsWith(`${guildId}:`)) lastFired.delete(key);
  }
}

export function stopAllAutoDeleteJobs(): void {
  scheduledRules.clear();
  lastFired.clear();
}

/**
 * Reemplaza las reglas SCHEDULED en memoria para el guild. Si el módulo está
 * desactivado, solo limpia. El tick (`processDueScheduledCleanups`) las ejecuta.
 */
export function syncAutoDeleteJobsForConfig(config: AutoDeleteConfig): void {
  stopAutoDeleteJobsForGuild(config.guildId);
  if (!botGateway || !config.enabled) return;

  const timezone = normalizeScheduledTimezone(config.timezone);
  const entries = config.rules
    .filter((rule) => rule.mode === "SCHEDULED")
    .map((rule) => ({ guildId: config.guildId, rule, timezone }));

  if (entries.length > 0) {
    scheduledRules.set(config.guildId, entries);
  }
}

/**
 * Tick del scheduler interno: ejecuta las reglas SCHEDULED cuyo `HH:mm` (+ días)
 * coincide con el minuto actual de su zona. De-dup por minuto/regla.
 */
export async function processDueScheduledCleanups(
  gateway: BotGateway,
  at: Date = new Date(),
): Promise<number> {
  let fired = 0;
  for (const entries of scheduledRules.values()) {
    for (const { guildId, rule, timezone } of entries) {
      const clock = clockPartsInZone(timezone, at);
      if (
        !isDailyScheduleDue(rule.scheduledTime, rule.scheduledDays ?? [], clock)
      ) {
        continue;
      }
      const key = `${guildId}:${rule.channelId}`;
      if (lastFired.get(key) === clock.stamp) continue;
      lastFired.set(key, clock.stamp);
      fired += 1;
      void runScheduledCleanup(gateway, guildId, rule);
    }
  }
  if (lastFired.size > 5_000) lastFired.clear();
  return fired;
}

/** Rehidrata las reglas SCHEDULED desde Postgres (arranque del bot). */
export async function rehydrateAllAutoDeleteJobs(): Promise<void> {
  stopAllAutoDeleteJobs();
  try {
    const configs = await listAllAutoDeleteConfigs();
    for (const config of configs) {
      syncAutoDeleteJobsForConfig(config);
    }
  } catch (error) {
    logger.warn(
      { err: error },
      "auto-delete: rehydrate scheduled rules failed:",
    );
  }
}
