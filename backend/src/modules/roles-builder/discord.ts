import type {
  CreateGuildRoleRequest,
  CreateGuildRoleResponse,
  DeleteGuildRoleResponse,
  RolePositionUpdate,
  RolesBuilderListResponse,
  RolesBuilderRole,
  UpdateGuildRoleRequest,
  UpdateGuildRoleResponse,
  UpdateRolePositionsResponse,
} from "@adobos/shared";
import {
  DISCORD_GUILD_ROLE_LIMIT,
  listRolePermissionKeys,
  parseRoleColor,
  ROLE_PERMISSION_GROUPS,
  ROLE_PERMISSION_KEY_SET,
} from "@adobos/shared";
import { DiscordAPIError, PermissionFlagsBits } from "discord.js";
import type {
  BotGateway,
  BotRoleAdminContext,
  RoleDetail,
} from "#core/discord/botGateway.js";

const AUDIT_REASON = "Adobos Bot — Roles Builder";

export class RolesBuilderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "RolesBuilderError";
  }
}

async function loadContext(
  gateway: BotGateway,
  guildId?: string,
): Promise<{ id: string; ctx: BotRoleAdminContext }> {
  if (!gateway.isReady()) {
    throw new RolesBuilderError(
      "The Discord bot is not connected.",
      503,
      "BOT_NOT_READY",
    );
  }
  const id = (guildId ?? "").trim();
  if (!id) {
    throw new RolesBuilderError("Missing guildId.", 400, "MISSING_GUILD_ID");
  }
  const ctx = await gateway.getRoleAdminContext(id);
  if (!ctx) {
    throw new RolesBuilderError(
      "The bot is not in that server or the guild is not cached yet.",
      404,
      "GUILD_NOT_FOUND",
    );
  }
  return { id, ctx };
}

function permissionKeysFromBitfield(bits: bigint): string[] {
  const keys: string[] = [];
  for (const key of listRolePermissionKeys()) {
    const flag = PermissionFlagsBits[key as keyof typeof PermissionFlagsBits];
    if (typeof flag === "bigint" && (bits & flag) === flag) {
      keys.push(key);
    }
  }
  return keys;
}

function mapRole(role: RoleDetail): RolesBuilderRole {
  const bits = role.permissions;
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    hexColor: role.hexColor.startsWith("#")
      ? role.hexColor.toUpperCase()
      : `#${role.hexColor.toUpperCase()}`,
    position: role.position,
    managed: role.managed,
    hoist: role.hoist,
    mentionable: role.mentionable,
    permissionKeys: permissionKeysFromBitfield(bits),
    hasAdministrator:
      (bits & PermissionFlagsBits.Administrator) ===
      PermissionFlagsBits.Administrator,
  };
}

function assertCanManageRoles(canManageRoles: boolean): void {
  if (!canManageRoles) {
    throw new RolesBuilderError(
      "The bot does not have the «Manage Roles» permission in this server.",
      403,
      "MISSING_MANAGE_ROLES",
    );
  }
}

/** Convierte claves del catálogo a bitfield. Nunca incluye Administrator. */
export function permissionsBitfieldFromKeys(
  keys: string[] | undefined,
): bigint {
  if (!keys?.length) return 0n;
  let bits = 0n;
  for (const key of keys) {
    if (key === "Administrator") continue;
    if (!ROLE_PERMISSION_KEY_SET.has(key)) continue;
    const flag = PermissionFlagsBits[key as keyof typeof PermissionFlagsBits];
    if (typeof flag === "bigint") {
      bits |= flag;
    }
  }
  return bits;
}

function resolveColor(value: string | null | undefined): number {
  const color = parseRoleColor(value);
  if (color === null) {
    throw new RolesBuilderError(
      "Invalid color. Use the #RRGGBB format.",
      400,
      "INVALID_COLOR",
    );
  }
  return color;
}

function resolveRoleName(raw: string | undefined): string {
  const name = (raw ?? "").trim();
  if (!name) {
    throw new RolesBuilderError(
      "The role name is required.",
      400,
      "MISSING_NAME",
    );
  }
  if (name.length > 100) {
    throw new RolesBuilderError(
      "The role name can't exceed 100 characters.",
      400,
      "NAME_TOO_LONG",
    );
  }
  return name;
}

function friendlyDiscordError(error: unknown, fallback: string): string {
  if (error instanceof DiscordAPIError) {
    if (error.code === 50013) {
      return "Insufficient permissions: the bot can't manage that role or position (hierarchy).";
    }
    if (error.code === 50035) {
      return "Invalid data while updating roles on Discord.";
    }
    if (error.code === 30035) {
      return `This server already has the maximum of ${DISCORD_GUILD_ROLE_LIMIT} Discord roles.`;
    }
    if (error.code === 10011) {
      return "That role no longer exists on Discord.";
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function assertRoleLimit(ctx: BotRoleAdminContext): void {
  if (ctx.roleCount >= DISCORD_GUILD_ROLE_LIMIT) {
    throw new RolesBuilderError(
      `This server already has the maximum of ${DISCORD_GUILD_ROLE_LIMIT} Discord roles.`,
      400,
      "ROLE_LIMIT",
    );
  }
}

/** Valida que el rol existe, no es managed y está por debajo del bot. */
function assertEditableRole(
  ctx: BotRoleAdminContext,
  roleId: string,
): RoleDetail {
  const id = roleId.trim();
  const role = ctx.roles.find((entry) => entry.id === id);
  if (!role) {
    throw new RolesBuilderError(`Role not found: ${id}`, 404, "ROLE_NOT_FOUND");
  }
  if (role.managed) {
    throw new RolesBuilderError(
      `The role «${role.name}» is managed and can't be managed.`,
      400,
      "ROLE_MANAGED",
    );
  }
  if (role.position >= ctx.bot.highestPosition) {
    throw new RolesBuilderError(
      `The role «${role.name}» is above (or at the level of) the bot and can't be managed.`,
      403,
      "ROLE_ABOVE_BOT",
    );
  }
  return role;
}

export async function listGuildRoles(
  gateway: BotGateway,
  guildId?: string,
): Promise<RolesBuilderListResponse> {
  const { id, ctx } = await loadContext(gateway, guildId);
  return {
    guildId: id,
    guildName: ctx.guildName,
    botHighestRoleId: ctx.bot.highestRoleId,
    botHighestPosition: ctx.bot.highestPosition,
    botCanManageRoles: ctx.bot.canManageRoles,
    botRoleName: ctx.bot.roleName,
    roleCount: ctx.roleCount,
    roleLimit: DISCORD_GUILD_ROLE_LIMIT,
    roles: ctx.roles.map(mapRole),
    permissionGroups: ROLE_PERMISSION_GROUPS,
  };
}

export async function createGuildRole(
  gateway: BotGateway,
  input: CreateGuildRoleRequest,
  guildId?: string,
): Promise<CreateGuildRoleResponse> {
  const { id, ctx } = await loadContext(gateway, guildId);
  assertCanManageRoles(ctx.bot.canManageRoles);
  assertRoleLimit(ctx);

  const name = resolveRoleName(input.name);
  const color = resolveColor(input.color);
  const permissions = permissionsBitfieldFromKeys(input.permissions);
  const position = Math.max(0, ctx.bot.highestPosition - 1);

  let role: RoleDetail;
  try {
    role = await gateway.createRole(id, {
      name,
      color,
      permissions,
      hoist: Boolean(input.hoist),
      mentionable: Boolean(input.mentionable),
      position,
      reason: AUDIT_REASON,
    });
  } catch (error) {
    throw new RolesBuilderError(
      friendlyDiscordError(error, "Couldn't create the role."),
      502,
      "DISCORD_CREATE_FAILED",
    );
  }

  return {
    role: mapRole(role),
    warning:
      role.position !== position
        ? "Discord placed the role in a different position. Reorder in the list if needed."
        : null,
  };
}

export async function updateGuildRole(
  gateway: BotGateway,
  roleId: string,
  input: UpdateGuildRoleRequest,
  guildId?: string,
): Promise<UpdateGuildRoleResponse> {
  const { id, ctx } = await loadContext(gateway, guildId);
  assertCanManageRoles(ctx.bot.canManageRoles);
  const role = assertEditableRole(ctx, roleId);

  const hasAdmin =
    (role.permissions & PermissionFlagsBits.Administrator) ===
    PermissionFlagsBits.Administrator;
  if (input.permissions !== undefined && hasAdmin) {
    throw new RolesBuilderError(
      "You can't change the permissions of a role with Administrator.",
      403,
      "PERMISSIONS_ADMIN_LOCKED",
    );
  }

  const patch: {
    name?: string;
    color?: number;
    permissions?: bigint;
    hoist?: boolean;
    mentionable?: boolean;
    reason: string;
  } = { reason: AUDIT_REASON };

  if (input.name !== undefined) patch.name = resolveRoleName(input.name);
  if (input.color !== undefined) patch.color = resolveColor(input.color);
  if (input.permissions !== undefined) {
    patch.permissions = permissionsBitfieldFromKeys(input.permissions);
  }
  if (input.hoist !== undefined) patch.hoist = Boolean(input.hoist);
  if (input.mentionable !== undefined) {
    patch.mentionable = Boolean(input.mentionable);
  }

  let updated: RoleDetail;
  try {
    updated = await gateway.updateRole(id, role.id, patch);
  } catch (error) {
    throw new RolesBuilderError(
      friendlyDiscordError(error, "Couldn't update the role."),
      502,
      "DISCORD_UPDATE_FAILED",
    );
  }

  return { role: mapRole(updated), warning: null };
}

export async function deleteGuildRole(
  gateway: BotGateway,
  roleId: string,
  guildId?: string,
): Promise<DeleteGuildRoleResponse> {
  const { id, ctx } = await loadContext(gateway, guildId);
  assertCanManageRoles(ctx.bot.canManageRoles);
  const role = assertEditableRole(ctx, roleId);

  try {
    await gateway.deleteRole(id, role.id, AUDIT_REASON);
  } catch (error) {
    throw new RolesBuilderError(
      friendlyDiscordError(error, "Couldn't delete the role."),
      502,
      "DISCORD_DELETE_FAILED",
    );
  }

  return { ok: true, roleId: role.id };
}

export async function updateRolePositions(
  gateway: BotGateway,
  positions: RolePositionUpdate[],
  guildId?: string,
): Promise<UpdateRolePositionsResponse> {
  const { id, ctx } = await loadContext(gateway, guildId);
  assertCanManageRoles(ctx.bot.canManageRoles);

  if (!Array.isArray(positions) || positions.length === 0) {
    throw new RolesBuilderError(
      "Send at least one position change.",
      400,
      "EMPTY_POSITIONS",
    );
  }

  const maxAllowed = Math.max(0, ctx.bot.highestPosition - 1);
  const payload: { roleId: string; position: number }[] = [];

  for (const entry of positions) {
    const roleId = String(entry.roleId ?? "").trim();
    const position = Math.floor(Number(entry.position));

    if (!roleId) {
      throw new RolesBuilderError(
        "Each entry needs a valid roleId.",
        400,
        "INVALID_ROLE_ID",
      );
    }
    if (!Number.isFinite(position) || position < 0) {
      throw new RolesBuilderError(
        "Positions must be numbers ≥ 0.",
        400,
        "INVALID_POSITION",
      );
    }
    if (position >= ctx.bot.highestPosition || position > maxAllowed) {
      throw new RolesBuilderError(
        `Position ${position} matches or exceeds the bot's role (pos ${ctx.bot.highestPosition}).`,
        400,
        "POSITION_ABOVE_BOT",
      );
    }

    assertEditableRole(ctx, roleId);
    payload.push({ roleId, position });
  }

  let roles: RoleDetail[];
  try {
    roles = await gateway.setRolePositions(id, payload, AUDIT_REASON);
  } catch (error) {
    throw new RolesBuilderError(
      friendlyDiscordError(
        error,
        "Couldn't save the new hierarchy on Discord.",
      ),
      502,
      "DISCORD_POSITIONS_FAILED",
    );
  }

  return { roles: roles.map(mapRole) };
}
