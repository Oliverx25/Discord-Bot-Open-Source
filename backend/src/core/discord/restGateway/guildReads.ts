import { PermissionFlagsBits, Routes } from "discord.js";
import type { Constructor } from "../baseGateway/core.js";
import type {
  ChannelDetail,
  ChannelSummary,
  EmojiSummary,
  GuildSummary,
  RoleSummary,
  StickerSummary,
} from "../botGateway.js";
import { DISCORD_CACHE_TTL, discordCacheKey } from "../discordCache.js";
import { cdn, hex, type RestGatewayCore } from "./core.js";

/** Lecturas de guild/canal/rol/emoji vía REST con caché read-through. */
export function GuildReadsMixin<TBase extends Constructor<RestGatewayCore>>(
  Base: TBase,
) {
  return class extends Base {
    getBotGuildIds(): Promise<string[]> {
      return this.cached(
        discordCacheKey.botGuildIds(),
        DISCORD_CACHE_TTL.botGuildIds,
        () => super.getBotGuildIds(),
      );
    }

    getGuild(guildId: string): Promise<GuildSummary | null> {
      return this.cached(
        discordCacheKey.guild(guildId),
        DISCORD_CACHE_TTL.guild,
        async () => {
          try {
            const guild = (await this.restClient().get(
              Routes.guild(guildId),
            )) as { id: string; name: string; icon?: string | null };
            const roles = await this.guildRoles(guildId);
            const booster = roles.find((r) => r.tags?.premium_subscriber_role);
            return {
              id: guild.id,
              name: guild.name,
              iconUrl: guild.icon
                ? cdn.icon(guild.id, guild.icon, {
                    extension: "png",
                    size: 256,
                  })
                : null,
              boosterRoleId: booster?.id ?? null,
            };
          } catch {
            return null;
          }
        },
      );
    }

    listChannels(guildId: string): Promise<ChannelSummary[]> {
      return this.cached(
        discordCacheKey.channels(guildId),
        DISCORD_CACHE_TTL.channels,
        async () => {
          const channels = (await this.restClient().get(
            Routes.guildChannels(guildId),
          )) as {
            id: string;
            name?: string | null;
            type: number;
            parent_id?: string | null;
            position?: number;
          }[];
          return channels.map((c) => ({
            id: c.id,
            name: c.name ?? "",
            type: c.type,
            parentId: c.parent_id ?? null,
            position: c.position ?? 0,
          }));
        },
      );
    }

    listRoles(guildId: string): Promise<RoleSummary[]> {
      return this.cached(
        discordCacheKey.roles(guildId),
        DISCORD_CACHE_TTL.roles,
        async () =>
          (await this.guildRoles(guildId)).map((r) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            hexColor: hex(r.color),
            position: r.position,
            managed: r.managed,
          })),
      );
    }

    listEmojis(guildId: string): Promise<EmojiSummary[]> {
      return this.cached(
        discordCacheKey.emojis(guildId),
        DISCORD_CACHE_TTL.emojis,
        async () => {
          const emojis = (await this.restClient().get(
            Routes.guildEmojis(guildId),
          )) as {
            id: string | null;
            name: string | null;
            animated?: boolean;
          }[];
          return emojis
            .filter(
              (e): e is { id: string; name: string; animated?: boolean } =>
                Boolean(e.id && e.name),
            )
            .map((e) => ({
              id: e.id,
              name: e.name,
              animated: Boolean(e.animated),
              url: cdn.emoji(e.id, { extension: e.animated ? "gif" : "png" }),
            }));
        },
      );
    }

    listStickers(guildId: string): Promise<StickerSummary[]> {
      return this.cached(
        discordCacheKey.stickers(guildId),
        DISCORD_CACHE_TTL.stickers,
        async () => {
          const stickers = (await this.restClient().get(
            Routes.guildStickers(guildId),
          )) as {
            id: string;
            name: string;
            description: string | null;
            format_type: number;
          }[];
          return stickers.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            format: String(s.format_type),
            url: cdn.sticker(s.id, "png"),
          }));
        },
      );
    }

    async getChannel(
      guildId: string,
      channelId: string,
    ): Promise<ChannelSummary | null> {
      const c = await this.channelInGuild(guildId, channelId);
      if (!c) return null;
      return {
        id: c.id,
        name: c.name ?? "",
        type: c.type,
        parentId: c.parent_id ?? null,
        position: c.position ?? 0,
      };
    }

    async getChannelDetail(
      guildId: string,
      channelId: string,
    ): Promise<ChannelDetail | null> {
      const c = await this.channelInGuild(guildId, channelId);
      if (!c) return null;
      return {
        id: c.id,
        name: c.name ?? "",
        type: c.type,
        parentId: c.parent_id ?? null,
        position: c.position ?? 0,
        topic: c.topic ?? null,
        slowmodeSeconds: c.rate_limit_per_user ?? 0,
        nsfw: Boolean(c.nsfw),
      };
    }

    async botHasGuildPermission(
      guildId: string,
      permission: bigint,
    ): Promise<boolean> {
      const [roles, me] = await Promise.all([
        this.guildRoles(guildId),
        this.rawMember(guildId, "@me"),
      ]);
      if (!me) return false;
      const roleById = new Map(roles.map((r) => [r.id, r]));
      const everyone = roleById.get(guildId);
      let perms = everyone ? BigInt(everyone.permissions) : 0n;
      for (const id of me.roles) {
        const role = roleById.get(id);
        if (role) perms |= BigInt(role.permissions);
      }
      if (
        (perms & PermissionFlagsBits.Administrator) ===
        PermissionFlagsBits.Administrator
      ) {
        return true;
      }
      return (perms & permission) === permission;
    }
  };
}
