import { Routes } from "discord.js";
import type { ChannelSummary, CreateChannelInput } from "../botGateway.js";
import { discordCacheKey } from "../discordCache.js";
import {
  bustDiscordCache,
  type Constructor,
  type RestClientCore,
} from "./core.js";

/** Gestión de canales: alta/baja, overwrites de permisos — implementación REST compartida. */
export function ChannelsMixin<TBase extends Constructor<RestClientCore>>(
  Base: TBase,
) {
  return class extends Base {
    #cachedBotUserId: string | null = null;

    async deleteChannel(
      guildId: string,
      channelId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient()
        .delete(Routes.channel(channelId), { reason })
        .catch(() => undefined);
      bustDiscordCache(
        discordCacheKey.channel(channelId),
        discordCacheKey.channels(guildId),
      );
    }

    async putChannelOverwrite(
      channelId: string,
      overwriteId: string,
      input: { type: number; allow: string; deny: string; reason?: string },
    ): Promise<void> {
      await this.restClient().put(
        Routes.channelPermission(channelId, overwriteId),
        {
          body: { type: input.type, allow: input.allow, deny: input.deny },
          reason: input.reason,
        },
      );
      bustDiscordCache(discordCacheKey.channel(channelId));
    }

    async deleteChannelOverwrite(
      channelId: string,
      overwriteId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient()
        .delete(Routes.channelPermission(channelId, overwriteId), { reason })
        .catch(() => undefined);
      bustDiscordCache(discordCacheKey.channel(channelId));
    }

    async createChannel(
      guildId: string,
      input: CreateChannelInput,
    ): Promise<ChannelSummary> {
      const created = (await this.restClient().post(
        Routes.guildChannels(guildId),
        {
          body: {
            name: input.name,
            type: input.type,
            parent_id: input.parentId ?? undefined,
            topic: input.topic,
            permission_overwrites: input.permissionOverwrites?.map((o) => ({
              id: o.id,
              type: o.type,
              allow: o.allow ?? "0",
              deny: o.deny ?? "0",
            })),
          },
          reason: input.reason,
        },
      )) as {
        id: string;
        name?: string | null;
        type: number;
        parent_id?: string | null;
        position?: number;
      };
      bustDiscordCache(discordCacheKey.channels(guildId));
      return {
        id: created.id,
        name: created.name ?? input.name,
        type: created.type,
        parentId: created.parent_id ?? null,
        position: created.position ?? 0,
      };
    }

    async getBotUserId(): Promise<string> {
      if (!this.#cachedBotUserId) {
        const me = (await this.restClient().get(Routes.user("@me"))) as {
          id: string;
        };
        this.#cachedBotUserId = me.id;
      }
      return this.#cachedBotUserId;
    }

    async setChannelOverwrites(
      channelId: string,
      overwrites: { id: string; type: number; allow: string; deny: string }[],
      reason?: string,
    ): Promise<void> {
      await this.restClient().patch(Routes.channel(channelId), {
        body: { permission_overwrites: overwrites },
        reason,
      });
      bustDiscordCache(discordCacheKey.channel(channelId));
    }
  };
}
