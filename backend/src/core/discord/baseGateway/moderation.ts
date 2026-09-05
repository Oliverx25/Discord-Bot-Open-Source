import { Routes } from "discord.js";
import { discordCacheKey } from "../discordCache.js";
import {
  bustDiscordCache,
  type Constructor,
  type RestClientCore,
} from "./core.js";

/** Moderación de miembros (moderation /action) — implementación REST compartida. */
export function ModerationMixin<TBase extends Constructor<RestClientCore>>(
  Base: TBase,
) {
  return class extends Base {
    async banMember(
      guildId: string,
      userId: string,
      opts: { reason?: string; deleteMessageSeconds?: number } = {},
    ): Promise<void> {
      await this.restClient().put(Routes.guildBan(guildId, userId), {
        body: { delete_message_seconds: opts.deleteMessageSeconds ?? 0 },
        reason: opts.reason,
      });
    }

    async unbanMember(
      guildId: string,
      userId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient().delete(Routes.guildBan(guildId, userId), {
        reason,
      });
    }

    async kickMember(
      guildId: string,
      userId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient().delete(Routes.guildMember(guildId, userId), {
        reason,
      });
    }

    async addMemberRole(
      guildId: string,
      userId: string,
      roleId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient().put(
        Routes.guildMemberRole(guildId, userId, roleId),
        { reason },
      );
    }

    async removeMemberRole(
      guildId: string,
      userId: string,
      roleId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient().delete(
        Routes.guildMemberRole(guildId, userId, roleId),
        { reason },
      );
    }

    async timeoutMember(
      guildId: string,
      userId: string,
      until: string | null,
      reason?: string,
    ): Promise<void> {
      await this.restClient().patch(Routes.guildMember(guildId, userId), {
        body: { communication_disabled_until: until },
        reason,
      });
    }

    async setChannelSlowmode(
      _guildId: string,
      channelId: string,
      seconds: number,
      reason?: string,
    ): Promise<void> {
      await this.restClient().patch(Routes.channel(channelId), {
        body: {
          rate_limit_per_user: Math.max(
            0,
            Math.min(21600, Math.round(seconds)),
          ),
        },
        reason,
      });
      bustDiscordCache(discordCacheKey.channel(channelId));
    }

    async createInvite(
      channelId: string,
      opts: {
        maxUses?: number;
        maxAgeSeconds?: number;
        unique?: boolean;
        reason?: string;
      } = {},
    ): Promise<string | null> {
      try {
        const invite = (await this.restClient().post(
          Routes.channelInvites(channelId),
          {
            body: {
              max_uses: opts.maxUses ?? 0,
              max_age: opts.maxAgeSeconds ?? 86_400,
              unique: opts.unique ?? true,
            },
            reason: opts.reason,
          },
        )) as { code: string };
        return `https://discord.gg/${invite.code}`;
      } catch {
        return null;
      }
    }
  };
}
