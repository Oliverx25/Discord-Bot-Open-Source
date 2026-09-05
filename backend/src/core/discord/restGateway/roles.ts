import { PermissionFlagsBits } from "discord.js";
import type { Constructor } from "../baseGateway/core.js";
import type {
  BotRoleAdminContext,
  GuildSummary,
  RoleDetail,
} from "../botGateway.js";
import { type APIRole, hex, type RestGatewayCore } from "./core.js";

/** El único método de `GuildReadsMixin` del que depende este mixin. */
interface HasGetGuild {
  getGuild(guildId: string): Promise<GuildSummary | null>;
}

/**
 * Contexto de administración de roles (editor del panel) vía REST. Depende
 * de `getGuild` (`GuildReadsMixin`) — debe componerse por encima de él en
 * `restGateway.ts`; el constraint de `TBase` lo exige en tiempo de compilación.
 */
export function RoleAdminMixin<
  TBase extends Constructor<RestGatewayCore & HasGetGuild>,
>(Base: TBase) {
  return class extends Base {
    async getRoleAdminContext(
      guildId: string,
    ): Promise<BotRoleAdminContext | null> {
      const [guild, roles, me] = await Promise.all([
        this.getGuild(guildId),
        this.guildRoles(guildId),
        this.rawMember(guildId, "@me"),
      ]);
      if (!guild || !me) return null;

      const roleById = new Map(roles.map((r) => [r.id, r]));
      const myRoles = me.roles
        .map((id) => roleById.get(id))
        .filter((r): r is APIRole => Boolean(r));
      const perms = myRoles.reduce((acc, r) => acc | BigInt(r.permissions), 0n);
      const canManageRoles =
        (perms & PermissionFlagsBits.Administrator) ===
          PermissionFlagsBits.Administrator ||
        (perms & PermissionFlagsBits.ManageRoles) ===
          PermissionFlagsBits.ManageRoles;
      const highest = myRoles
        .filter((r) => r.id !== guildId)
        .sort((a, b) => b.position - a.position)[0];

      return {
        guildName: guild.name,
        roleCount: roles.length,
        bot: {
          highestRoleId: highest?.id ?? null,
          highestPosition: highest?.position ?? 0,
          canManageRoles,
          roleName: highest?.name ?? null,
        },
        roles: roles
          .filter((r) => r.id !== guildId)
          .map(
            (r): RoleDetail => ({
              id: r.id,
              name: r.name,
              color: r.color,
              hexColor: hex(r.color),
              position: r.position,
              managed: r.managed,
              hoist: r.hoist,
              mentionable: r.mentionable,
              permissions: BigInt(r.permissions),
            }),
          )
          .sort((a, b) => b.position - a.position),
      };
    }
  };
}
