import { Routes } from "discord.js";
import { BotGatewayError, type OutgoingMessage } from "../botGateway.js";
import type { Constructor, RestClientCore } from "./core.js";

interface DiscordWebhook {
  id: string;
  name: string | null;
  token?: string;
}

function isUnknownWebhookError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; status?: unknown; rawError?: unknown };
  if (e.code === 10015) return true;
  const raw = e.rawError as { code?: unknown } | undefined;
  return raw?.code === 10015 || e.status === 404;
}

/** Webhooks de canal (action-logs) — implementación REST compartida. */
export function WebhooksMixin<TBase extends Constructor<RestClientCore>>(
  Base: TBase,
) {
  return class extends Base {
    async listChannelWebhooks(
      channelId: string,
    ): Promise<{ id: string; name: string; token: string | null }[]> {
      const hooks = (await this.restClient().get(
        Routes.channelWebhooks(channelId),
      )) as DiscordWebhook[];
      return hooks.map((hook) => ({
        id: hook.id,
        name: hook.name ?? "",
        token: hook.token ?? null,
      }));
    }

    async createChannelWebhook(
      channelId: string,
      name: string,
      reason?: string,
    ): Promise<{ id: string; token: string }> {
      const hook = (await this.restClient().post(
        Routes.channelWebhooks(channelId),
        { body: { name }, reason },
      )) as DiscordWebhook;
      return { id: hook.id, token: hook.token ?? "" };
    }

    async executeWebhook(
      webhookId: string,
      token: string,
      payload: OutgoingMessage & { username?: string; avatarUrl?: string },
    ): Promise<{ messageId: string }> {
      try {
        const message = (await this.restClient().post(
          `${Routes.webhook(webhookId, token)}?wait=true`,
          {
            body: {
              content: payload.content,
              embeds: payload.embeds,
              components: payload.components,
              username: payload.username,
              avatar_url: payload.avatarUrl,
              allowed_mentions: payload.allowedMentions,
            },
            auth: false,
          },
        )) as { id: string };
        return { messageId: message.id };
      } catch (error) {
        if (isUnknownWebhookError(error)) {
          throw new BotGatewayError(
            "The webhook no longer exists on Discord.",
            404,
            "UNKNOWN_WEBHOOK",
          );
        }
        throw error;
      }
    }
  };
}
