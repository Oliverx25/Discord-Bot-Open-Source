import type { Constructor } from "../baseGateway/core.js";
import type { ChannelOverwrite } from "../botGateway.js";
import type { RestGatewayCore } from "./core.js";

/** Overwrites de canal (lectura) vía REST. */
export function ChannelsMixin<TBase extends Constructor<RestGatewayCore>>(
  Base: TBase,
) {
  return class extends Base {
    async getChannelOverwrites(
      guildId: string,
      channelId: string,
    ): Promise<ChannelOverwrite[] | null> {
      const channel = await this.channelInGuild(guildId, channelId);
      if (!channel) return null;
      return (channel.permission_overwrites ?? []).map((o) => ({
        id: o.id,
        type: Number(o.type),
        allow: o.allow,
        deny: o.deny,
      }));
    }
  };
}
