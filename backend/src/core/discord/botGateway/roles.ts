import type { RoleSummary } from "./guildReads.js";

/** Rol con permisos, para el editor de roles del panel. */
export interface RoleDetail extends RoleSummary {
  hoist: boolean;
  mentionable: boolean;
  /** Bitfield de permisos de Discord. */
  permissions: bigint;
}

export interface BotRoleAdminContext {
  guildName: string;
  roles: RoleDetail[];
  roleCount: number;
  bot: {
    highestRoleId: string | null;
    highestPosition: number;
    canManageRoles: boolean;
    roleName: string | null;
  };
}

export interface CreateRoleInput {
  name: string;
  color: number;
  permissions: bigint;
  hoist: boolean;
  mentionable: boolean;
  position: number;
  reason?: string;
}

export interface UpdateRoleInput {
  name?: string;
  color?: number;
  permissions?: bigint;
  hoist?: boolean;
  mentionable?: boolean;
  reason?: string;
}

/** Administración de roles (editor del panel). */
export interface RoleAdminGateway {
  /** Roles del guild + contexto del bot (rol más alto, `Manage Roles`). `null` si el bot no está en el guild. */
  getRoleAdminContext(guildId: string): Promise<BotRoleAdminContext | null>;
  createRole(guildId: string, input: CreateRoleInput): Promise<RoleDetail>;
  updateRole(
    guildId: string,
    roleId: string,
    patch: UpdateRoleInput,
  ): Promise<RoleDetail>;
  deleteRole(guildId: string, roleId: string, reason?: string): Promise<void>;
  setRolePositions(
    guildId: string,
    positions: { roleId: string; position: number }[],
    reason?: string,
  ): Promise<RoleDetail[]>;
}
