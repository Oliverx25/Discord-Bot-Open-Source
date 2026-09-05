import type { OutgoingMessage } from "./messaging.js";

/** Webhooks de canal (action-logs). */
export interface WebhooksGateway {
  listChannelWebhooks(
    channelId: string,
  ): Promise<{ id: string; name: string; token: string | null }[]>;
  createChannelWebhook(
    channelId: string,
    name: string,
    reason?: string,
  ): Promise<{ id: string; token: string }>;
  /** Ejecuta un webhook. Lanza `BotGatewayError` 404 `UNKNOWN_WEBHOOK` si Discord ya no lo tiene. */
  executeWebhook(
    webhookId: string,
    token: string,
    payload: OutgoingMessage & { username?: string; avatarUrl?: string },
  ): Promise<{ messageId: string }>;
}
