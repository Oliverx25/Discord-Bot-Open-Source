import type { ActionLogWebhooksMapping } from "@adobos/shared";
import type { EmbedBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { type BotGateway, BotGatewayError } from "#core/discord/botGateway.js";
import { getDb, one } from "#db/client.js";
import { actionLogsConfig } from "#db/schema.js";

/** Nombre de creación del webhook en el canal (fallback legacy). */
export const ACTION_LOG_WEBHOOK_NAME = "Adobos Audit";
const LEGACY_WEBHOOK_NAMES = new Set([
  ACTION_LOG_WEBHOOK_NAME,
  "Adobos Audit Log",
]);

function parseMapping(
  raw: string | undefined | null,
): ActionLogWebhooksMapping {
  try {
    return JSON.parse(raw ?? "{}") as ActionLogWebhooksMapping;
  } catch {
    return {};
  }
}

async function readWebhooksMapping(
  guildId: string,
): Promise<ActionLogWebhooksMapping> {
  const row = await one(
    getDb()
      .select({ webhooksMapping: actionLogsConfig.webhooksMapping })
      .from(actionLogsConfig)
      .where(eq(actionLogsConfig.guildId, guildId))
      .limit(1),
  );
  return parseMapping(row?.webhooksMapping);
}

async function writeWebhooksMapping(
  guildId: string,
  mapping: ActionLogWebhooksMapping,
): Promise<void> {
  await getDb()
    .update(actionLogsConfig)
    .set({
      webhooksMapping: JSON.stringify(mapping),
      updatedAt: new Date(),
    })
    .where(eq(actionLogsConfig.guildId, guildId));
}

async function forgetWebhook(
  guildId: string,
  channelId: string,
): Promise<void> {
  const mapping = await readWebhooksMapping(guildId);
  if (!(channelId in mapping)) return;
  delete mapping[channelId];
  await writeWebhooksMapping(guildId, mapping);
}

async function rememberWebhook(
  guildId: string,
  channelId: string,
  webhookId: string,
): Promise<void> {
  const mapping = await readWebhooksMapping(guildId);
  if (mapping[channelId] === webhookId) return;
  mapping[channelId] = webhookId;
  await writeWebhooksMapping(guildId, mapping);
}

function isUnknownWebhook(error: unknown): boolean {
  return error instanceof BotGatewayError && error.code === "UNKNOWN_WEBHOOK";
}

/** Identidad del bot en el servidor: `<apodo> Audit` + avatar de servidor/global. */
async function resolveAuditIdentity(
  gateway: BotGateway,
  guildId: string,
): Promise<{ username: string; avatarUrl?: string }> {
  const profile = await gateway.getBotProfile(guildId).catch(() => null);
  const serverName = profile?.nickname || profile?.username || "Adobos";
  return {
    username: `${serverName} Audit`.slice(0, 80),
    avatarUrl:
      profile?.serverAvatarUrl ?? profile?.globalAvatarUrl ?? undefined,
  };
}

async function resolveOrCreateWebhook(
  gateway: BotGateway,
  guildId: string,
  channelId: string,
): Promise<{ id: string; token: string }> {
  const mapping = await readWebhooksMapping(guildId);
  const cachedId = mapping[channelId];

  const hooks = await gateway.listChannelWebhooks(channelId);
  if (cachedId) {
    const cached = hooks.find((hook) => hook.id === cachedId && hook.token);
    if (cached?.token) return { id: cached.id, token: cached.token };
    await forgetWebhook(guildId, channelId);
  }

  const existing = hooks.find(
    (hook) => LEGACY_WEBHOOK_NAMES.has(hook.name) && hook.token,
  );
  if (existing?.token) {
    await rememberWebhook(guildId, channelId, existing.id);
    return { id: existing.id, token: existing.token };
  }

  const created = await gateway.createChannelWebhook(
    channelId,
    ACTION_LOG_WEBHOOK_NAME,
    "Adobos Action Logs — send via webhook",
  );
  await rememberWebhook(guildId, channelId, created.id);
  return created;
}

export interface SendActionLogWebhookInput {
  guildId: string;
  channelId: string;
  embeds: EmbedBuilder[];
}

/**
 * Envía embeds por webhook del canal.
 * Identidad = perfil del bot en el servidor (`nickname` + avatar).
 * Si Discord borró el webhook (10015), limpia cache y reintenta una vez.
 */
export async function sendActionLogWebhook(
  gateway: BotGateway,
  input: SendActionLogWebhookInput,
): Promise<{ messageId: string }> {
  const identity = await resolveAuditIdentity(gateway, input.guildId);
  const payload = {
    embeds: input.embeds.map((embed) => embed.toJSON()),
    username: identity.username,
    avatarUrl: identity.avatarUrl,
    allowedMentions: { parse: [] as const },
  };

  let webhook = await resolveOrCreateWebhook(
    gateway,
    input.guildId,
    input.channelId,
  );

  try {
    return await gateway.executeWebhook(webhook.id, webhook.token, payload);
  } catch (error) {
    if (!isUnknownWebhook(error)) throw error;
    await forgetWebhook(input.guildId, input.channelId);
    webhook = await resolveOrCreateWebhook(
      gateway,
      input.guildId,
      input.channelId,
    );
    return await gateway.executeWebhook(webhook.id, webhook.token, payload);
  }
}
