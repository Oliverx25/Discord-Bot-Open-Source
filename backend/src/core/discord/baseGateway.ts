import type { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import { env } from "#core/env.js";
import { BotGatewayError, type OutgoingMessage } from "./botGateway.js";
import { getDiscordRest } from "./rest.js";

interface DiscordWebhook {
  id: string;
  name: string | null;
  token?: string;
}

/**
 * Base común de los adaptadores de `BotGateway`.
 *
 * Aquí viven (a partir de la wave 15) las **escrituras** — que son la misma
 * llamada REST por token tanto si hay gateway vivo (`LocalClientGateway`) como
 * si no (`RestGateway`). Se implementan **una sola vez**. Las lecturas las
 * resuelve cada subclase a su manera (caché del Client / REST + Redis).
 */
export abstract class BaseGateway {
  private rest: REST | null = null;

  /** Cliente REST por token. Lanza si no hay `DISCORD_TOKEN`. */
  protected restClient(): REST {
    if (!this.rest) {
      const token = env().DISCORD_TOKEN?.trim();
      if (!token) {
        throw new BotGatewayError(
          "No Discord token configured for REST operations.",
          503,
          "NO_DISCORD_TOKEN",
        );
      }
      this.rest = getDiscordRest(token);
    }
    return this.rest;
  }

  // ─────────── Reacciones ───────────

  async addReaction(
    channelId: string,
    messageId: string,
    emoji: string,
  ): Promise<void> {
    await this.restClient()
      .put(
        Routes.channelMessageOwnReaction(
          channelId,
          messageId,
          encodeURIComponent(emoji),
        ),
      )
      .catch(() => undefined);
  }

  async clearReactions(channelId: string, messageId: string): Promise<void> {
    await this.restClient()
      .delete(Routes.channelMessageAllReactions(channelId, messageId))
      .catch(() => undefined);
  }

  // ─────────── Webhooks ───────────

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
}

function isUnknownWebhookError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; status?: unknown; rawError?: unknown };
  if (e.code === 10015) return true;
  const raw = e.rawError as { code?: unknown } | undefined;
  return raw?.code === 10015 || e.status === 404;
}
