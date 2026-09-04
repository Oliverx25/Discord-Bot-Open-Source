import {
  type AutoroleAssignDenyReason,
  type AutoroleRoleSnapshot,
  autoroleAssignDenyReason,
  canAssignAutorole,
} from "@adobos/shared";
import type { Client, Guild, Role } from "discord.js";
import type { BotGateway } from "#core/discord/botGateway.js";
import { AutoRoleError } from "./errors.js";

function snapshot(role: Role): AutoroleRoleSnapshot {
  return {
    id: role.id,
    managed: role.managed,
    position: role.position,
  };
}

export function botHighestPosition(guild: Guild): number {
  return guild.members.me?.roles.highest.position ?? 0;
}

export function isRoleAssignableInGuild(guild: Guild, roleId: string): boolean {
  const role = guild.roles.cache.get(roleId);
  return canAssignAutorole(
    role ? snapshot(role) : null,
    guild.id,
    botHighestPosition(guild),
  );
}

function messageForReason(
  reason: AutoroleAssignDenyReason,
  roleName?: string,
): { message: string; status: number; code: string } {
  const label = roleName ? `«${roleName}»` : "that role";
  if (reason === "missing") {
    return {
      message: "That role does not exist in this server.",
      status: 400,
      code: "ROLE_NOT_FOUND",
    };
  }
  if (reason === "everyone") {
    return {
      message: "@everyone can't be assigned.",
      status: 400,
      code: "ROLE_EVERYONE",
    };
  }
  if (reason === "managed") {
    return {
      message: `The role ${label} is managed and Discord does not allow assigning it.`,
      status: 400,
      code: "ROLE_MANAGED",
    };
  }
  return {
    message: `The role ${label} is at or above the bot.`,
    status: 403,
    code: "ROLE_ABOVE_BOT",
  };
}

export async function assertAssignableRole(
  guild: Guild,
  roleId: string,
): Promise<Role> {
  let role = guild.roles.cache.get(roleId) ?? null;
  if (!role) {
    role = await guild.roles.fetch(roleId).catch(() => null);
  }
  const reason = autoroleAssignDenyReason(
    role ? snapshot(role) : null,
    guild.id,
    botHighestPosition(guild),
  );
  if (reason) {
    const info = messageForReason(reason, role?.name);
    throw new AutoRoleError(info.message, info.status, info.code);
  }
  return role as Role;
}

export async function assertAssignableRoleIds(
  bot: Client,
  guildId: string,
  roleIds: string[],
): Promise<void> {
  if (!bot.isReady()) {
    throw new AutoRoleError("The bot is not connected.", 503, "BOT_NOT_READY");
  }
  const guild = await bot.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    throw new AutoRoleError(
      "The bot is not in that server.",
      404,
      "GUILD_NOT_FOUND",
    );
  }
  if (!guild.members.me) {
    await guild.members.fetchMe().catch(() => null);
  }
  const unique = [...new Set(roleIds.filter(Boolean))];
  for (const id of unique) {
    await assertAssignableRole(guild, id);
  }
}

/**
 * Igual que `assertAssignableRoleIds` pero a través del puerto `BotGateway`
 * (rol `api`, sin gateway vivo). Usa `getRoleAdminContext` para la jerarquía.
 */
export async function assertAssignableRoleIdsViaGateway(
  gateway: BotGateway,
  guildId: string,
  roleIds: string[],
): Promise<void> {
  if (!gateway.isReady()) {
    throw new AutoRoleError("The bot is not connected.", 503, "BOT_NOT_READY");
  }
  const ctx = await gateway.getRoleAdminContext(guildId);
  if (!ctx) {
    throw new AutoRoleError(
      "The bot is not in that server.",
      404,
      "GUILD_NOT_FOUND",
    );
  }
  const byId = new Map(ctx.roles.map((role) => [role.id, role]));
  const unique = [...new Set(roleIds.filter(Boolean))];
  for (const id of unique) {
    const role = byId.get(id);
    const snap: AutoroleRoleSnapshot | null = role
      ? { id: role.id, managed: role.managed, position: role.position }
      : null;
    const reason = autoroleAssignDenyReason(
      snap,
      guildId,
      ctx.bot.highestPosition,
    );
    if (reason) {
      const info = messageForReason(reason, role?.name);
      throw new AutoRoleError(info.message, info.status, info.code);
    }
  }
}

export function assignableSkipMessage(roleId: string, guild: Guild): string {
  const role = guild.roles.cache.get(roleId);
  const reason = autoroleAssignDenyReason(
    role ? snapshot(role) : null,
    guild.id,
    botHighestPosition(guild),
  );
  if (!reason) return "That role can no longer be assigned.";
  return messageForReason(reason, role?.name).message;
}
