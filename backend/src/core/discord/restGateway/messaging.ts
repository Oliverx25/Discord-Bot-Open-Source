import { Routes } from "discord.js";
import type { Constructor } from "../baseGateway/core.js";
import type { FetchedMessage } from "../botGateway.js";
import {
  type APIUser,
  cdn,
  displayName,
  hex,
  type RestGatewayCore,
  userAvatarUrl,
} from "./core.js";

/** Lectura de un mensaje puntual (vista previa del panel) vía REST. */
export function MessagingMixin<TBase extends Constructor<RestGatewayCore>>(
  Base: TBase,
) {
  return class extends Base {
    async fetchMessage(
      guildId: string,
      channelId: string,
      messageId: string,
    ): Promise<FetchedMessage> {
      const channel = await this.channelInGuild(guildId, channelId);
      if (!channel) {
        throw Object.assign(new Error("Channel not found"), {
          status: 404,
          code: "CHANNEL_NOT_FOUND",
        });
      }
      let message: {
        id: string;
        channel_id: string;
        content?: string;
        pinned?: boolean;
        embeds?: Record<string, unknown>[];
        author: APIUser;
        member?: { nick?: string | null };
        reactions?: {
          count: number;
          emoji: { id: string | null; name: string | null; animated?: boolean };
        }[];
      };
      try {
        message = (await this.restClient().get(
          Routes.channelMessage(channelId, messageId),
        )) as typeof message;
      } catch {
        throw Object.assign(new Error("Message not found"), {
          status: 404,
          code: "MESSAGE_NOT_FOUND",
        });
      }

      const meRes = (await this.restClient()
        .get(Routes.user("@me"))
        .catch(() => null)) as APIUser | null;

      return {
        id: message.id,
        channelId: channel.id,
        content: message.content ?? "",
        embeds: (message.embeds ?? []).map((e) => ({
          title: (e.title as string) ?? undefined,
          description: (e.description as string) ?? undefined,
          url: (e.url as string) ?? undefined,
          color:
            typeof e.color === "number" ? hex(e.color as number) : undefined,
          authorName: (e.author as { name?: string })?.name ?? undefined,
          authorIconUrl:
            (e.author as { icon_url?: string })?.icon_url ?? undefined,
          thumbnailUrl: (e.thumbnail as { url?: string })?.url ?? undefined,
          imageUrl: (e.image as { url?: string })?.url ?? undefined,
          footerText: (e.footer as { text?: string })?.text ?? undefined,
          footerIconUrl:
            (e.footer as { icon_url?: string })?.icon_url ?? undefined,
          timestamp: Boolean(e.timestamp),
        })),
        author: {
          id: message.author.id,
          username: message.author.username,
          displayName: displayName(message.author, message.member?.nick),
          avatarUrl: userAvatarUrl(message.author),
        },
        isBotAuthor: Boolean(meRes && message.author.id === meRes.id),
        pinned: Boolean(message.pinned),
        reactions: (message.reactions ?? []).map((r) => {
          if (r.emoji.id) {
            return {
              emojiKey: `custom:${r.emoji.id}`,
              name: r.emoji.name,
              id: r.emoji.id,
              animated: Boolean(r.emoji.animated),
              imageUrl: cdn.emoji(r.emoji.id, {
                extension: r.emoji.animated ? "gif" : "png",
              }),
              count: r.count,
            };
          }
          return {
            emojiKey: `unicode:${r.emoji.name ?? "?"}`,
            name: r.emoji.name,
            id: null,
            animated: false,
            imageUrl: null,
            count: r.count,
          };
        }),
      };
    }
  };
}
