import { DiscordAPIError } from "discord.js";
import { safeAvatarOptions } from "#lib/discordMember.js";
import type { Constructor } from "../baseGateway/core.js";
import {
  BotGatewayError,
  type ChannelMessageBrief,
  type FetchedMessage,
} from "../botGateway.js";
import type { LocalClientGatewayCore } from "./core.js";

/** Lectura de mensajes puntuales/recientes sobre el `Client` vivo. */
export function MessagingMixin<
  TBase extends Constructor<LocalClientGatewayCore>,
>(Base: TBase) {
  return class extends Base {
    async fetchMessage(
      guildId: string,
      channelId: string,
      messageId: string,
    ): Promise<FetchedMessage> {
      const guild = this.guild(guildId);
      if (!guild) {
        throw new BotGatewayError(
          "The bot is not in that server.",
          404,
          "GUILD_NOT_FOUND",
        );
      }
      const channel = await guild.channels
        .fetch(channelId)
        .catch((error: unknown) => {
          if (error instanceof DiscordAPIError) {
            if (error.code === 10003) {
              throw new BotGatewayError(
                "The channel does not exist in this server.",
                404,
                "CHANNEL_NOT_FOUND",
              );
            }
            if (error.code === 50001 || error.code === 50013) {
              throw new BotGatewayError(
                "Missing Access: the bot can't see that channel.",
                403,
                "MISSING_ACCESS",
              );
            }
          }
          throw error;
        });
      if (!channel) {
        throw new BotGatewayError(
          "The channel does not exist in this server.",
          404,
          "CHANNEL_NOT_FOUND",
        );
      }
      if (!channel.isTextBased() || channel.isDMBased()) {
        throw new BotGatewayError(
          "The channel does not support reading messages.",
          400,
          "INVALID_CHANNEL_TYPE",
        );
      }

      const message = await channel.messages.fetch(messageId).catch(() => {
        throw new BotGatewayError(
          "The message does not exist in the selected channel.",
          404,
          "MESSAGE_NOT_FOUND",
        );
      });

      return {
        id: message.id,
        channelId: channel.id,
        content: message.content ?? "",
        embeds: message.embeds.map((embed) => ({
          title: embed.title ?? undefined,
          description: embed.description ?? undefined,
          url: embed.url ?? undefined,
          color: embed.hexColor ?? undefined,
          authorName: embed.author?.name ?? undefined,
          authorIconUrl: embed.author?.iconURL ?? undefined,
          thumbnailUrl: embed.thumbnail?.url ?? undefined,
          imageUrl: embed.image?.url ?? undefined,
          footerText: embed.footer?.text ?? undefined,
          footerIconUrl: embed.footer?.iconURL ?? undefined,
          timestamp: Boolean(embed.timestamp),
        })),
        author: {
          id: message.author.id,
          username: message.author.username,
          displayName:
            message.member?.displayName ||
            message.author.globalName ||
            message.author.username,
          avatarUrl: message.member
            ? message.member.displayAvatarURL(safeAvatarOptions(64))
            : message.author.displayAvatarURL(safeAvatarOptions(64)),
        },
        isBotAuthor: Boolean(
          this.client.user && message.author.id === this.client.user.id,
        ),
        pinned: message.pinned,
        reactions: [...message.reactions.cache.values()].map((reaction) => {
          const emoji = reaction.emoji;
          if (emoji.id) {
            return {
              emojiKey: `custom:${emoji.id}`,
              name: emoji.name,
              id: emoji.id,
              animated: Boolean(emoji.animated),
              imageUrl: emoji.imageURL({ size: 64 }),
              count: reaction.count,
            };
          }
          return {
            emojiKey: `unicode:${emoji.name ?? "?"}`,
            name: emoji.name,
            id: null,
            animated: false,
            imageUrl: null,
            count: reaction.count,
          };
        }),
      };
    }

    async listChannelMessages(
      channelId: string,
      opts: { limit?: number; before?: string } = {},
    ): Promise<ChannelMessageBrief[]> {
      const channel = await this.client.channels
        .fetch(channelId)
        .catch(() => null);
      if (!channel || !channel.isTextBased() || channel.isDMBased()) return [];
      const batch = await channel.messages
        .fetch({
          limit: Math.max(1, Math.min(100, opts.limit ?? 50)),
          before: opts.before,
        })
        .catch(() => null);
      if (!batch) return [];
      return [...batch.values()].map((m) => ({
        id: m.id,
        authorId: m.author.id,
        authorTag:
          m.author.discriminator && m.author.discriminator !== "0"
            ? `${m.author.username}#${m.author.discriminator}`
            : m.author.username,
        authorIsBot: m.author.bot,
        content: m.content ?? "",
        createdAt: m.createdAt.toISOString(),
        attachmentCount: m.attachments.size,
        hasComponents: m.components.length > 0,
        pinned: m.pinned,
      }));
    }
  };
}
