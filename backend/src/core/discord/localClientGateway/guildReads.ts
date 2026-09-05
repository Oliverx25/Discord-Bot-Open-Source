import type { Constructor } from "../baseGateway/core.js";
import type {
  ChannelDetail,
  ChannelSummary,
  EmojiSummary,
  GuildSummary,
  RoleSummary,
  StickerSummary,
} from "../botGateway.js";
import type { LocalClientGatewayCore } from "./core.js";

/** Lecturas de guild/canal/rol/emoji sobre el `Client` vivo (caché en memoria). */
export function GuildReadsMixin<
  TBase extends Constructor<LocalClientGatewayCore>,
>(Base: TBase) {
  return class extends Base {
    async getBotGuildIds(): Promise<string[]> {
      return [...this.client.guilds.cache.keys()];
    }

    async getGuild(guildId: string): Promise<GuildSummary | null> {
      const guild = this.guild(guildId);
      if (!guild) return null;
      return {
        id: guild.id,
        name: guild.name,
        iconUrl: guild.iconURL({ size: 256 }),
        boosterRoleId: guild.roles.premiumSubscriberRole?.id ?? null,
      };
    }

    async listChannels(guildId: string): Promise<ChannelSummary[]> {
      const guild = this.guild(guildId);
      if (!guild) return [];
      if (guild.channels.cache.size === 0) {
        await guild.channels.fetch().catch(() => null);
      }
      return [...guild.channels.cache.values()]
        .filter((channel): channel is NonNullable<typeof channel> =>
          Boolean(channel),
        )
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          parentId: "parentId" in channel ? channel.parentId : null,
          position: "rawPosition" in channel ? channel.rawPosition : 0,
        }));
    }

    async listRoles(guildId: string): Promise<RoleSummary[]> {
      const guild = this.guild(guildId);
      if (!guild) return [];
      if (guild.roles.cache.size === 0) {
        await guild.roles.fetch().catch(() => null);
      }
      return [...guild.roles.cache.values()].map((role) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        hexColor: role.hexColor,
        position: role.position,
        managed: role.managed,
      }));
    }

    async listEmojis(guildId: string): Promise<EmojiSummary[]> {
      const guild = this.guild(guildId);
      if (!guild) return [];
      if (guild.emojis.cache.size === 0) {
        await guild.emojis.fetch().catch(() => null);
      }
      return [...guild.emojis.cache.values()]
        .filter((emoji) => Boolean(emoji.name && emoji.id))
        .map((emoji) => ({
          id: emoji.id,
          name: emoji.name ?? "emoji",
          animated: Boolean(emoji.animated),
          url: emoji.imageURL({ size: 64 }) ?? emoji.url,
        }));
    }

    async listStickers(guildId: string): Promise<StickerSummary[]> {
      const guild = this.guild(guildId);
      if (!guild) return [];
      if (guild.stickers.cache.size === 0) {
        await guild.stickers.fetch().catch(() => null);
      }
      return [...guild.stickers.cache.values()].map((sticker) => ({
        id: sticker.id,
        name: sticker.name,
        description: sticker.description,
        format: String(sticker.format),
        url: sticker.url,
      }));
    }

    async getChannel(
      guildId: string,
      channelId: string,
    ): Promise<ChannelSummary | null> {
      const guild = this.guild(guildId);
      if (!guild) return null;
      const channel =
        guild.channels.cache.get(channelId) ??
        (await guild.channels.fetch(channelId).catch(() => null));
      if (!channel || channel.guildId !== guildId) return null;
      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: "parentId" in channel ? channel.parentId : null,
        position: "rawPosition" in channel ? channel.rawPosition : 0,
      };
    }

    async getChannelDetail(
      guildId: string,
      channelId: string,
    ): Promise<ChannelDetail | null> {
      const summary = await this.getChannel(guildId, channelId);
      if (!summary) return null;
      const guild = this.guild(guildId);
      const channel = guild?.channels.cache.get(channelId);
      return {
        ...summary,
        topic:
          channel && "topic" in channel
            ? ((channel.topic as string | null) ?? null)
            : null,
        slowmodeSeconds:
          channel && "rateLimitPerUser" in channel
            ? (channel.rateLimitPerUser ?? 0)
            : 0,
        nsfw: channel && "nsfw" in channel ? Boolean(channel.nsfw) : false,
      };
    }

    async listActiveThreads(
      guildId: string,
    ): Promise<{ id: string; parentId: string | null; type: number }[]> {
      const guild = this.guild(guildId);
      if (!guild) return [];
      const active = await guild.channels
        .fetchActiveThreads()
        .catch(() => null);
      if (!active) return [];
      return [...active.threads.values()].map((t) => ({
        id: t.id,
        parentId: t.parentId ?? null,
        type: t.type,
      }));
    }

    async botHasGuildPermission(
      guildId: string,
      permission: bigint,
    ): Promise<boolean> {
      const me = this.guild(guildId)?.members.me ?? null;
      return Boolean(me?.permissions.has(permission));
    }
  };
}
