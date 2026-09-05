import { PermissionFlagsBits, Routes } from "discord.js";
import type { Constructor } from "../baseGateway/core.js";
import type {
  GuildBanEntry,
  MemberActionability,
  MemberInfo,
  MemberProfile,
  UserInfo,
} from "../botGateway.js";
import {
  type APIMember,
  type APIRole,
  type APIUser,
  displayName,
  hex,
  memberAvatarUrl,
  type RestGatewayCore,
  userAvatarUrl,
} from "./core.js";

function toMemberInfo(guildId: string, member: APIMember): MemberInfo {
  return {
    userId: member.user.id,
    username: member.user.username,
    globalName: member.user.global_name ?? null,
    displayName: displayName(member.user, member.nick),
    avatarUrl: memberAvatarUrl(guildId, member),
    bot: Boolean(member.user.bot),
    joinedAt: member.joined_at ?? null,
    timedOutUntil: member.communication_disabled_until ?? null,
    roles: [],
  };
}

/** Lecturas de miembros/usuarios del guild vía REST. */
export function MembersMixin<TBase extends Constructor<RestGatewayCore>>(
  Base: TBase,
) {
  return class extends Base {
    async getUser(userId: string): Promise<UserInfo | null> {
      try {
        const user = (await this.restClient().get(
          Routes.user(userId),
        )) as APIUser;
        return {
          userId: user.id,
          username: user.username,
          globalName: user.global_name ?? null,
          displayName: displayName(user),
          avatarUrl: userAvatarUrl(user),
        };
      } catch {
        return null;
      }
    }

    async resolveMembers(
      guildId: string,
      userIds: string[],
    ): Promise<Map<string, MemberProfile>> {
      const unique = [...new Set(userIds.filter(Boolean))];
      const out = new Map<string, MemberProfile>();
      await Promise.all(
        unique.map(async (userId) => {
          const member = await this.rawMember(guildId, userId);
          if (member) {
            out.set(userId, {
              userId,
              username: member.user.username,
              displayName: displayName(member.user, member.nick),
              avatarUrl: memberAvatarUrl(guildId, member),
            });
            return;
          }
          const user = await this.getUser(userId);
          out.set(userId, {
            userId,
            username: user?.username ?? "desconocido",
            displayName: user?.displayName ?? "Unknown User",
            avatarUrl: user?.avatarUrl ?? null,
          });
        }),
      );
      return out;
    }

    async #listRawMembers(guildId: string): Promise<APIMember[]> {
      const all: APIMember[] = [];
      let after = "0";
      for (let page = 0; page < 50; page++) {
        const batch = (await this.restClient().get(
          Routes.guildMembers(guildId),
          { query: new URLSearchParams({ limit: "1000", after }) },
        )) as APIMember[];
        all.push(...batch);
        if (batch.length < 1000) break;
        after = batch[batch.length - 1]!.user.id;
      }
      return all;
    }

    async listMembers(guildId: string): Promise<MemberInfo[]> {
      const [members, roles] = await Promise.all([
        this.#listRawMembers(guildId),
        this.guildRoles(guildId),
      ]);
      const roleById = new Map(roles.map((r) => [r.id, r]));
      return members.map((m) => ({
        ...toMemberInfo(guildId, m),
        roles: m.roles
          .map((id) => roleById.get(id))
          .filter((r): r is APIRole => Boolean(r) && r?.id !== guildId)
          .sort((a, b) => b.position - a.position)
          .map((r) => ({ id: r.id, name: r.name, hexColor: hex(r.color) })),
      }));
    }

    async getMember(
      guildId: string,
      userId: string,
    ): Promise<MemberInfo | null> {
      const member = await this.rawMember(guildId, userId);
      if (!member) return null;
      const roles = await this.guildRoles(guildId);
      const roleById = new Map(roles.map((r) => [r.id, r]));
      return {
        ...toMemberInfo(guildId, member),
        roles: member.roles
          .map((id) => roleById.get(id))
          .filter((r): r is APIRole => Boolean(r) && r?.id !== guildId)
          .sort((a, b) => b.position - a.position)
          .map((r) => ({ id: r.id, name: r.name, hexColor: hex(r.color) })),
      };
    }

    async listBans(guildId: string): Promise<GuildBanEntry[]> {
      const all: { user: APIUser; reason?: string | null }[] = [];
      let after = "0";
      for (let page = 0; page < 50; page++) {
        const batch = (await this.restClient().get(Routes.guildBans(guildId), {
          query: new URLSearchParams({ limit: "1000", after }),
        })) as { user: APIUser; reason?: string | null }[];
        all.push(...batch);
        if (batch.length < 1000) break;
        after = batch[batch.length - 1]!.user.id;
      }
      return all.map((ban) => ({
        userId: ban.user.id,
        username: ban.user.username,
        globalName: ban.user.global_name ?? null,
        displayName: displayName(ban.user),
        avatarUrl: userAvatarUrl(ban.user),
        reason: ban.reason?.trim() || null,
      }));
    }

    async getMemberActionability(
      guildId: string,
      userId: string,
    ): Promise<MemberActionability | null> {
      const [target, me, guildRaw, roles] = await Promise.all([
        this.rawMember(guildId, userId),
        this.rawMember(guildId, "@me"),
        this.restClient()
          .get(Routes.guild(guildId))
          .catch(() => null) as Promise<{ owner_id?: string } | null>,
        this.guildRoles(guildId),
      ]);
      if (!target || !me) return null;

      const roleById = new Map(roles.map((r) => [r.id, r]));
      const highestPos = (ids: string[]): number =>
        ids.reduce(
          (max, id) => Math.max(max, roleById.get(id)?.position ?? 0),
          0,
        );
      const permsOf = (ids: string[]): bigint => {
        const everyone = roleById.get(guildId);
        let acc = everyone ? BigInt(everyone.permissions) : 0n;
        for (const id of ids) {
          const role = roleById.get(id);
          if (role) acc |= BigInt(role.permissions);
        }
        return acc;
      };

      const botUserId = me.user.id;
      const ownerId = guildRaw?.owner_id;
      const botIsOwner = botUserId === ownerId;
      const botPerms = permsOf(me.roles);
      const isAdmin = (perms: bigint): boolean =>
        (perms & PermissionFlagsBits.Administrator) ===
        PermissionFlagsBits.Administrator;
      const botHas = (bit: bigint): boolean =>
        botIsOwner || isAdmin(botPerms) || (botPerms & bit) === bit;

      const targetPerms = permsOf(target.roles);
      const targetIsAdmin = target.user.id === ownerId || isAdmin(targetPerms);
      const manageable =
        target.user.id !== ownerId &&
        target.user.id !== botUserId &&
        (botIsOwner || highestPos(me.roles) > highestPos(target.roles));

      return {
        isBot: target.user.id === botUserId,
        isOwner: target.user.id === ownerId,
        bannable: manageable && botHas(PermissionFlagsBits.BanMembers),
        kickable: manageable && botHas(PermissionFlagsBits.KickMembers),
        moderatable:
          manageable &&
          botHas(PermissionFlagsBits.ModerateMembers) &&
          !targetIsAdmin,
      };
    }
  };
}
