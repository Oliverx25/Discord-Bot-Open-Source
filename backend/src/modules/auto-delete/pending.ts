import type { AutoDeleteConfig } from "@adobos/shared";
import { DiscordAPIError } from "discord.js";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { type BotGateway, BotGatewayError } from "#core/discord/botGateway.js";
import { logger } from "#core/log.js";
import { getDb } from "#db/client.js";
import { autoDeletePending } from "#db/schema.js";
import { rememberBotMessageDeletes } from "#modules/action-logs/audit.js";

const DUE_BATCH = 50;

interface DuePendingRow {
  guildId: string;
  channelId: string;
  messageId: string;
}

/**
 * Reclama de forma atómica filas vencidas y sin lease vivo
 * (`FOR UPDATE SKIP LOCKED`, lease 2 min): dos workers no borran el mismo
 * mensaje. Si el borrado falla, el lease expira y otro tick lo reintenta.
 */
async function claimDuePending(limit: number): Promise<DuePendingRow[]> {
  const rows = await getDb().execute(sql`
    WITH due AS (
      SELECT guild_id, message_id FROM auto_delete_pending
      WHERE delete_at <= now()
        AND (claimed_until IS NULL OR claimed_until < now())
      ORDER BY delete_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE auto_delete_pending p
       SET claimed_until = now() + interval '2 minutes'
      FROM due
     WHERE p.guild_id = due.guild_id AND p.message_id = due.message_id
    RETURNING p.guild_id AS "guildId", p.channel_id AS "channelId",
              p.message_id AS "messageId"
  `);
  return (rows as unknown as DuePendingRow[]).map((r) => ({
    guildId: String(r.guildId),
    channelId: String(r.channelId),
    messageId: String(r.messageId),
  }));
}

export async function enqueueCountdownDelete(input: {
  guildId: string;
  channelId: string;
  messageId: string;
  ruleChannelId: string;
  deleteAt: Date;
}): Promise<void> {
  await getDb()
    .insert(autoDeletePending)
    .values({
      guildId: input.guildId,
      channelId: input.channelId,
      messageId: input.messageId,
      ruleChannelId: input.ruleChannelId,
      deleteAt: input.deleteAt,
    })
    .onConflictDoNothing();
}

export async function prunePendingForConfig(
  config: AutoDeleteConfig,
): Promise<void> {
  const db = getDb();
  if (!config.enabled) {
    await db
      .delete(autoDeletePending)
      .where(eq(autoDeletePending.guildId, config.guildId));
    return;
  }
  const keep = config.rules
    .filter((rule) => rule.mode === "COUNTDOWN")
    .map((rule) => rule.channelId);
  if (keep.length === 0) {
    await db
      .delete(autoDeletePending)
      .where(eq(autoDeletePending.guildId, config.guildId));
    return;
  }
  await db
    .delete(autoDeletePending)
    .where(
      and(
        eq(autoDeletePending.guildId, config.guildId),
        notInArray(autoDeletePending.ruleChannelId, keep),
      ),
    );
}

function shouldDropPending(error: unknown): boolean {
  if (error instanceof DiscordAPIError) {
    const code = Number(error.code);
    // Unknown Message / Missing Access / Missing Permissions
    return code === 10008 || code === 50001 || code === 50013;
  }
  return false;
}

const DROP_GATEWAY_CODES = new Set([
  "MESSAGE_NOT_FOUND",
  "CHANNEL_NOT_FOUND",
  "GUILD_NOT_FOUND",
  "MISSING_ACCESS",
  "INVALID_CHANNEL_TYPE",
]);

export async function processDueCountdownDeletes(
  gateway: BotGateway,
): Promise<number> {
  const due = await claimDuePending(DUE_BATCH);

  let processed = 0;
  for (const row of due) {
    processed += 1;
    try {
      let message: Awaited<ReturnType<BotGateway["fetchMessage"]>>;
      try {
        message = await gateway.fetchMessage(
          row.guildId,
          row.channelId,
          row.messageId,
        );
      } catch (error) {
        if (
          error instanceof BotGatewayError &&
          DROP_GATEWAY_CODES.has(error.code)
        ) {
          await removePending(row.guildId, row.messageId);
          continue;
        }
        throw error;
      }
      if (message.pinned) {
        await removePending(row.guildId, row.messageId);
        continue;
      }
      await rememberBotMessageDeletes(row.guildId, [row.messageId]);
      await gateway.deleteMessage(row.guildId, row.channelId, row.messageId);
      await removePending(row.guildId, row.messageId);
    } catch (error) {
      if (shouldDropPending(error)) {
        await removePending(row.guildId, row.messageId).catch(() => undefined);
        continue;
      }
      logger.warn(
        { err: error },
        `auto-delete: tick failed (${row.guildId}/${row.messageId}):`,
      );
    }
  }
  return processed;
}

async function removePending(
  guildId: string,
  messageId: string,
): Promise<void> {
  await getDb()
    .delete(autoDeletePending)
    .where(
      and(
        eq(autoDeletePending.guildId, guildId),
        eq(autoDeletePending.messageId, messageId),
      ),
    );
}
