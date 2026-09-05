import type { Constructor } from "../baseGateway/core.js";
import type { ChannelOverwrite } from "../botGateway.js";
import type { LocalClientGatewayCore } from "./core.js";

/** Overwrites de canal + identidad del bot sobre el `Client` vivo. */
export function ChannelsMixin<
  TBase extends Constructor<LocalClientGatewayCore>,
>(Base: TBase) {
  return class extends Base {
    async getBotUserId(): Promise<string> {
      return this.client.user?.id ?? "";
    }

    async getChannelOverwrites(
      guildId: string,
      channelId: string,
    ): Promise<ChannelOverwrite[] | null> {
      const guild = this.guild(guildId);
      if (!guild) return null;
      const channel =
        guild.channels.cache.get(channelId) ??
        (await guild.channels.fetch(channelId).catch(() => null));
      if (
        !channel ||
        channel.guildId !== guildId ||
        !("permissionOverwrites" in channel)
      ) {
        return null;
      }
      return [...channel.permissionOverwrites.cache.values()].map(
        (overwrite) => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield.toString(),
          deny: overwrite.deny.bitfield.toString(),
        }),
      );
    }
  };
}
