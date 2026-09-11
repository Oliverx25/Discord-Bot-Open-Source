import type { Constructor } from "../baseGateway/core.js";
import type { BotProfileSummary, GuildSummary } from "../botGateway.js";
import { DISCORD_CACHE_TTL, discordCacheKey } from "../discordCache.js";
import {
  AVATAR,
  cdn,
  displayName,
  memberBannerUrl,
  type RestGatewayCore,
  userAvatarUrl,
  userBannerUrl,
} from "./core.js";

/** El único método de `GuildReadsMixin` del que depende este mixin. */
interface HasGetGuild {
  getGuild(guildId: string): Promise<GuildSummary | null>;
}

/**
 * Perfil del bot en el guild (apodo/avatar de servidor) vía REST. Depende de
 * `getGuild` (`GuildReadsMixin`) — debe componerse por encima de él en
 * `restGateway.ts`; el constraint de `TBase` lo hace explícito y lo exige
 * en tiempo de compilación.
 */
export function BotProfileMixin<
  TBase extends Constructor<RestGatewayCore & HasGetGuild>,
>(Base: TBase) {
  return class extends Base {
    getBotProfile(guildId: string): Promise<BotProfileSummary> {
      return this.cached(
        discordCacheKey.botProfile(guildId),
        DISCORD_CACHE_TTL.botProfile,
        async () => {
          const [guild, me, botUser] = await Promise.all([
            this.getGuild(guildId),
            this.rawMember(guildId, "@me"),
            this.currentUser().catch(() => null),
          ]);
          if (!guild || !me) {
            throw Object.assign(new Error("Bot not in guild"), {
              status: 404,
              code: "GUILD_NOT_FOUND",
            });
          }
          return {
            guildId,
            guildName: guild.name,
            nickname: me.nick ?? "",
            displayName: displayName(me.user, me.nick),
            username: me.user.username,
            tag: me.user.discriminator
              ? `${me.user.username}#${me.user.discriminator}`
              : me.user.username,
            serverAvatarUrl: me.avatar
              ? cdn.guildMemberAvatar(guildId, me.user.id, me.avatar, AVATAR)
              : null,
            globalAvatarUrl: userAvatarUrl(me.user),
            globalBannerUrl: userBannerUrl(botUser ?? me.user),
            serverBannerUrl: memberBannerUrl(guildId, me),
            hasServerAvatar: Boolean(me.avatar),
          };
        },
      );
    }
  };
}
