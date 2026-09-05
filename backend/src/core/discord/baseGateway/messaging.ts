import { Routes } from "discord.js";
import type {
  ChannelMessageBrief,
  EditMessageResult,
  OutgoingMessage,
  PublishedEmbedMedia,
  SentMessageResult,
} from "../botGateway.js";
import type { Constructor, RestClientCore } from "./core.js";

const UNKNOWN_MESSAGE = 10008;

interface APIMessageLite {
  id: string;
  channel_id: string;
  embeds?: {
    author?: { icon_url?: string };
    thumbnail?: { url?: string };
    image?: { url?: string };
    footer?: { icon_url?: string };
  }[];
}

function embedMediaOf(
  message: APIMessageLite,
): PublishedEmbedMedia | undefined {
  const embed = message.embeds?.[0];
  if (!embed) return undefined;
  return {
    authorIconUrl: embed.author?.icon_url,
    thumbnailUrl: embed.thumbnail?.url,
    imageUrl: embed.image?.url,
    footerIconUrl: embed.footer?.icon_url,
  };
}

function isDiscordCode(error: unknown, code: number): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; rawError?: { code?: unknown } };
  return e.code === code || e.rawError?.code === code;
}

/** Envío/edición/borrado de mensajes y reacciones — implementación REST compartida. */
export function MessagingMixin<TBase extends Constructor<RestClientCore>>(
  Base: TBase,
) {
  return class extends Base {
    async sendMessage(
      _guildId: string,
      channelId: string,
      message: OutgoingMessage,
    ): Promise<SentMessageResult> {
      const sent = (await this.restClient().post(
        Routes.channelMessages(channelId),
        {
          body: {
            content: message.content,
            embeds: message.embeds,
            components: message.components,
            allowed_mentions: message.allowedMentions,
          },
          files: message.files?.map((f) => ({ name: f.name, data: f.data })),
        },
      )) as APIMessageLite;
      return {
        messageId: sent.id,
        channelId: sent.channel_id,
        embedMedia: embedMediaOf(sent),
      };
    }

    async editMessage(
      _guildId: string,
      channelId: string,
      messageId: string,
      message: OutgoingMessage,
    ): Promise<EditMessageResult> {
      try {
        const edited = (await this.restClient().patch(
          Routes.channelMessage(channelId, messageId),
          {
            body: {
              content: message.content ?? null,
              embeds: message.embeds ?? [],
              components: message.components ?? [],
              allowed_mentions: message.allowedMentions,
            },
            files: message.files?.map((f) => ({ name: f.name, data: f.data })),
          },
        )) as APIMessageLite;
        return { orphaned: false, embedMedia: embedMediaOf(edited) };
      } catch (error) {
        if (isDiscordCode(error, UNKNOWN_MESSAGE)) return { orphaned: true };
        throw error;
      }
    }

    async deleteMessage(
      _guildId: string,
      channelId: string,
      messageId: string,
    ): Promise<{ orphaned: boolean }> {
      try {
        await this.restClient().delete(
          Routes.channelMessage(channelId, messageId),
        );
        return { orphaned: false };
      } catch (error) {
        if (isDiscordCode(error, UNKNOWN_MESSAGE)) return { orphaned: true };
        throw error;
      }
    }

    async sendDirectMessage(
      userId: string,
      message: OutgoingMessage,
    ): Promise<{ sent: boolean }> {
      try {
        const dm = (await this.restClient().post(Routes.userChannels(), {
          body: { recipient_id: userId },
        })) as { id: string };
        await this.restClient().post(Routes.channelMessages(dm.id), {
          body: {
            content: message.content,
            embeds: message.embeds,
            components: message.components,
            allowed_mentions: message.allowedMentions,
          },
        });
        return { sent: true };
      } catch {
        return { sent: false };
      }
    }

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

    async pinMessage(
      channelId: string,
      messageId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient()
        .put(Routes.channelPin(channelId, messageId), { reason })
        .catch(() => undefined);
    }

    async listChannelMessages(
      channelId: string,
      opts: { limit?: number; before?: string } = {},
    ): Promise<ChannelMessageBrief[]> {
      const query = new URLSearchParams({
        limit: String(Math.max(1, Math.min(100, opts.limit ?? 50))),
      });
      if (opts.before) query.set("before", opts.before);
      const msgs = (await this.restClient().get(
        Routes.channelMessages(channelId),
        { query },
      )) as {
        id: string;
        content?: string;
        timestamp: string;
        author: {
          id: string;
          username: string;
          discriminator?: string;
          bot?: boolean;
        };
        attachments?: unknown[];
        components?: unknown[];
        pinned?: boolean;
      }[];
      return msgs.map((m) => ({
        id: m.id,
        authorId: m.author.id,
        authorTag:
          m.author.discriminator && m.author.discriminator !== "0"
            ? `${m.author.username}#${m.author.discriminator}`
            : m.author.username,
        authorIsBot: Boolean(m.author.bot),
        content: m.content ?? "",
        createdAt: m.timestamp,
        attachmentCount: m.attachments?.length ?? 0,
        hasComponents: (m.components?.length ?? 0) > 0,
        pinned: Boolean(m.pinned),
      }));
    }

    async bulkDeleteMessageIds(
      channelId: string,
      messageIds: string[],
      reason?: string,
    ): Promise<void> {
      const ids = [...new Set(messageIds)].slice(0, 100);
      if (ids.length === 0) return;
      if (ids.length === 1) {
        await this.restClient()
          .delete(Routes.channelMessage(channelId, ids[0]!), { reason })
          .catch(() => undefined);
        return;
      }
      await this.restClient()
        .post(Routes.channelBulkDelete(channelId), {
          body: { messages: ids },
          reason,
        })
        .catch(() => undefined);
    }

    async bulkDeleteMessages(
      channelId: string,
      opts: { limit: number; filterUserId?: string | null },
    ): Promise<number> {
      const limit = Math.max(1, Math.min(100, Math.round(opts.limit)));
      const fetched = (await this.restClient().get(
        Routes.channelMessages(channelId),
        { query: new URLSearchParams({ limit: "100" }) },
      )) as { id: string; author?: { id?: string }; timestamp?: string }[];
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const ids = fetched
        .filter((m) => !m.timestamp || Date.parse(m.timestamp) > twoWeeksAgo)
        .filter((m) => !opts.filterUserId || m.author?.id === opts.filterUserId)
        .map((m) => m.id)
        .slice(0, limit);
      if (ids.length === 0) return 0;
      if (ids.length === 1) {
        await this.restClient().delete(
          Routes.channelMessage(channelId, ids[0]!),
        );
        return 1;
      }
      await this.restClient().post(Routes.channelBulkDelete(channelId), {
        body: { messages: ids },
      });
      return ids.length;
    }
  };
}
