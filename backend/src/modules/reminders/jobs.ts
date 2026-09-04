import type { Reminder } from "@adobos/shared";
import { ChannelType } from "discord.js";
import type { BotGateway } from "#core/discord/botGateway.js";
import { logger } from "#core/log.js";
import { defineQueue } from "#core/queue/index.js";
import {
  bumpReminderAttempt,
  claimDueReminders,
  clearReminderClaim,
  deleteReminderById,
  getReminder,
} from "./domain/reminders.js";

let botGateway: BotGateway | null = null;

interface DueJob {
  id: number;
  guildId: string;
}

const queue = defineQueue<DueJob>("reminders");

export function bindRemindersScheduler(gateway: BotGateway): void {
  botGateway = gateway;
  queue.process((job) => processReminder(job.id, job.guildId));
}

async function tryDm(
  gateway: BotGateway,
  reminder: Reminder,
): Promise<boolean> {
  const { sent } = await gateway.sendDirectMessage(reminder.userId, {
    content: `⏰ Reminder: ${reminder.message}`,
  });
  return sent;
}

/** Tipos de canal a los que NO se puede enviar el recordatorio. */
const NON_SENDABLE = new Set<number>([
  ChannelType.GuildVoice,
  ChannelType.GuildStageVoice,
  ChannelType.GuildCategory,
  ChannelType.GuildForum,
  ChannelType.GuildMedia,
]);

async function tryChannel(
  gateway: BotGateway,
  reminder: Reminder,
): Promise<boolean> {
  try {
    const channel = await gateway
      .getChannel(reminder.guildId, reminder.channelId)
      .catch(() => undefined);
    // Solo descartamos si el canal existe y no admite mensajes; un `null`
    // (fallo transitorio) deja que `sendMessage` lo intente igual.
    if (channel && NON_SENDABLE.has(channel.type)) return false;
    await gateway.sendMessage(reminder.guildId, reminder.channelId, {
      content: `<@${reminder.userId}> reminder: ${reminder.message}`,
      allowedMentions: { users: [reminder.userId] },
    });
    return true;
  } catch (error: unknown) {
    logger.warn(
      { err: error },
      `reminders: channel failed (id=${reminder.id})`,
    );
    return false;
  }
}

export async function deliverReminder(
  gateway: BotGateway,
  reminder: Reminder,
): Promise<boolean> {
  if (await tryDm(gateway, reminder)) {
    await deleteReminderById(reminder.id);
    return true;
  }
  if (await tryChannel(gateway, reminder)) {
    await deleteReminderById(reminder.id);
    return true;
  }
  await bumpReminderAttempt(reminder.id);
  return false;
}

/**
 * Consumidor: entrega un recordatorio. `deliverReminder` gestiona el estado
 * terminal (borra al entregar, o incrementa `attempts`). Si el gateway no está
 * listo lanza → BullMQ reintenta. Si no, libera el lease para el siguiente ciclo.
 */
export async function processReminder(
  id: number,
  guildId: string,
): Promise<void> {
  const gateway = botGateway;
  if (!gateway?.isReady()) throw new Error("reminders: gateway no listo");
  const fresh = await getReminder(id, guildId).catch(() => null);
  if (!fresh) return;
  await deliverReminder(gateway, fresh);
  await clearReminderClaim(id).catch(() => undefined);
}

/** Productor (líder): reclama recordatorios vencidos y los encola. */
export async function processDueReminders(): Promise<number> {
  if (!botGateway?.isReady()) return 0;
  const claimed = await claimDueReminders();
  for (const job of claimed) {
    await queue.add(job);
  }
  return claimed.length;
}
