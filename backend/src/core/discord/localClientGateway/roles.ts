import { PermissionFlagsBits, type Role } from "discord.js";
import type { Constructor } from "../baseGateway/core.js";
import type { BotRoleAdminContext, RoleDetail } from "../botGateway.js";
import type { LocalClientGatewayCore } from "./core.js";

function toRoleDetail(role: Role): RoleDetail {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    hexColor: role.hexColor,
    position: role.position,
    managed: role.managed,
    hoist: role.hoist,
    mentionable: role.mentionable,
    permissions: role.permissions.bitfield,
  };
}

/** Contexto de administración de roles (editor del panel) sobre el `Client` vivo. */
export function RoleAdminMixin<
  TBase extends Constructor<LocalClientGatewayCore>,
>(Base: TBase) {
  return class extends Base {
    async getRoleAdminContext(
      guildId: string,
    ): Promise<BotRoleAdminContext | null> {
      const guild = this.guild(guildId);
      if (!guild) return null;
      await guild.roles.fetch().catch(() => null);

      const me = guild.members.me;
      const highest = me?.roles.highest;
      const isEveryone = highest ? highest.id === guild.id : true;

      return {
        guildName: guild.name,
        roles: [...guild.roles.cache.values()]
          .filter((role) => role.id !== guild.id)
          .map(toRoleDetail)
          .sort((a, b) => b.position - a.position),
        roleCount: guild.roles.cache.size,
        bot: {
          highestRoleId: isEveryone ? null : (highest?.id ?? null),
          highestPosition: highest?.position ?? 0,
          canManageRoles: Boolean(
            me?.permissions.has(PermissionFlagsBits.ManageRoles),
          ),
          roleName: isEveryone ? null : (highest?.name ?? null),
        },
      };
    }
  };
}
