import type { Guild } from "discord.js";
import type { Constructor } from "../baseGateway/core.js";
import { BotGatewayError, type BotProfileSummary } from "../botGateway.js";
import type { LocalClientGatewayCore } from "./core.js";

const AVATAR_OPTS = {
  size: 256,
  extension: "png",
  forceStatic: true,
} as const;

/** Perfil del bot en el guild (apodo/avatar de servidor) sobre el `Client` vivo. */
export function BotProfileMixin<
  TBase extends Constructor<LocalClientGatewayCore>,
>(Base: TBase) {
  return class extends Base {
    #guildOrThrow(guildId: string): Guild {
      const guild = this.guild(guildId);
      if (!guild) {
        throw new BotGatewayError(
          "The bot is not in that server.",
          404,
          "GUILD_NOT_FOUND",
        );
      }
      return guild;
    }

    async getBotProfile(guildId: string): Promise<BotProfileSummary> {
      const guild = this.#guildOrThrow(guildId);
      const me = await guild.members.fetchMe({ force: true });
      return {
        guildId: guild.id,
        guildName: guild.name,
        nickname: me.nickname ?? "",
        displayName: me.displayName,
        username: me.user.username,
        tag: me.user.tag,
        serverAvatarUrl: me.avatarURL(AVATAR_OPTS) ?? null,
        globalAvatarUrl: me.user.displayAvatarURL(AVATAR_OPTS),
        hasServerAvatar: Boolean(me.avatar),
      };
    }
  };
}
