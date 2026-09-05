import type { GuildMember } from "discord.js";
import { resolveMembersBatch, safeAvatarOptions } from "#lib/discordMember.js";
import type { Constructor } from "../baseGateway/core.js";
import type {
  GuildBanEntry,
  MemberActionability,
  MemberInfo,
  MemberProfile,
  UserInfo,
} from "../botGateway.js";
import type { LocalClientGatewayCore } from "./core.js";

function toMemberInfo(member: GuildMember): MemberInfo {
  return {
    userId: member.id,
    username: member.user.username,
    globalName: member.user.globalName,
    displayName: member.displayName,
    avatarUrl: member.displayAvatarURL(safeAvatarOptions(256)),
    bot: member.user.bot,
    joinedAt: member.joinedAt?.toISOString() ?? null,
    timedOutUntil: member.communicationDisabledUntil?.toISOString() ?? null,
    roles: member.roles.cache
      .filter((role) => role.id !== member.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((role) => ({
        id: role.id,
        name: role.name,
        hexColor: role.hexColor,
      })),
  };
}

/** Lecturas de miembros/usuarios del guild sobre el `Client` vivo. */
export function MembersMixin<TBase extends Constructor<LocalClientGatewayCore>>(
  Base: TBase,
) {
  return class extends Base {
    async resolveMembers(
      guildId: string,
      userIds: string[],
    ): Promise<Map<string, MemberProfile>> {
      return resolveMembersBatch(this.guild(guildId), this.client, userIds);
    }

    async listMembers(guildId: string): Promise<MemberInfo[]> {
      const guild = this.guild(guildId);
      if (!guild) return [];
      await guild.members.fetch().catch(() => null);
      return [...guild.members.cache.values()].map(toMemberInfo);
    }

    async getMember(
      guildId: string,
      userId: string,
    ): Promise<MemberInfo | null> {
      const guild = this.guild(guildId);
      if (!guild) return null;
      const member =
        guild.members.cache.get(userId) ??
        (await guild.members.fetch(userId).catch(() => null));
      return member ? toMemberInfo(member) : null;
    }

    async getUser(userId: string): Promise<UserInfo | null> {
      const user = await this.client.users.fetch(userId).catch(() => null);
      if (!user) return null;
      return {
        userId: user.id,
        username: user.username,
        globalName: user.globalName,
        displayName: user.globalName || user.username,
        avatarUrl: user.displayAvatarURL(safeAvatarOptions(256)),
      };
    }

    async listBans(guildId: string): Promise<GuildBanEntry[]> {
      const guild = this.guild(guildId);
      if (!guild) return [];
      const bans = await guild.bans.fetch();
      return [...bans.values()].map((ban) => ({
        userId: ban.user.id,
        username: ban.user.username,
        globalName: ban.user.globalName,
        displayName: ban.user.globalName || ban.user.username,
        avatarUrl: ban.user.displayAvatarURL(safeAvatarOptions(256)),
        reason: ban.reason?.trim() || null,
      }));
    }

    async getMemberActionability(
      guildId: string,
      userId: string,
    ): Promise<MemberActionability | null> {
      const guild = this.guild(guildId);
      if (!guild) return null;
      const member =
        guild.members.cache.get(userId) ??
        (await guild.members.fetch(userId).catch(() => null));
      if (!member) return null;
      return {
        isBot: member.id === (guild.members.me?.id ?? this.client.user?.id),
        isOwner: member.id === guild.ownerId,
        bannable: member.bannable,
        kickable: member.kickable,
        moderatable: member.moderatable,
      };
    }
  };
}
