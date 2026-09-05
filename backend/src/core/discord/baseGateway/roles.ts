import { Routes } from "discord.js";
import type {
  CreateRoleInput,
  RoleDetail,
  UpdateRoleInput,
} from "../botGateway.js";
import { discordCacheKey } from "../discordCache.js";
import {
  bustDiscordCache,
  type Constructor,
  type RestClientCore,
} from "./core.js";

interface APIRoleLite {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
  hoist: boolean;
  mentionable: boolean;
}

function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function toRoleDetail(role: APIRoleLite): RoleDetail {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    hexColor: hexColor(role.color),
    position: role.position,
    managed: role.managed,
    hoist: role.hoist,
    mentionable: role.mentionable,
    permissions: BigInt(role.permissions),
  };
}

/** Administración de roles (editor del panel) — implementación REST compartida. */
export function RoleAdminMixin<TBase extends Constructor<RestClientCore>>(
  Base: TBase,
) {
  return class extends Base {
    async createRole(
      guildId: string,
      input: CreateRoleInput,
    ): Promise<RoleDetail> {
      const role = (await this.restClient().post(Routes.guildRoles(guildId), {
        body: {
          name: input.name,
          color: input.color,
          permissions: input.permissions.toString(),
          hoist: input.hoist,
          mentionable: input.mentionable,
        },
        reason: input.reason,
      })) as APIRoleLite;
      if (input.position > 0) {
        await this.restClient()
          .patch(Routes.guildRoles(guildId), {
            body: [{ id: role.id, position: input.position }],
            reason: input.reason,
          })
          .catch(() => undefined);
      }
      bustDiscordCache(discordCacheKey.roles(guildId));
      return toRoleDetail(role);
    }

    async updateRole(
      guildId: string,
      roleId: string,
      patch: UpdateRoleInput,
    ): Promise<RoleDetail> {
      const body: Record<string, unknown> = {};
      if (patch.name !== undefined) body.name = patch.name;
      if (patch.color !== undefined) body.color = patch.color;
      if (patch.permissions !== undefined) {
        body.permissions = patch.permissions.toString();
      }
      if (patch.hoist !== undefined) body.hoist = patch.hoist;
      if (patch.mentionable !== undefined) body.mentionable = patch.mentionable;
      const role = (await this.restClient().patch(
        Routes.guildRole(guildId, roleId),
        { body, reason: patch.reason },
      )) as APIRoleLite;
      bustDiscordCache(discordCacheKey.roles(guildId));
      return toRoleDetail(role);
    }

    async deleteRole(
      guildId: string,
      roleId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient().delete(Routes.guildRole(guildId, roleId), {
        reason,
      });
      bustDiscordCache(discordCacheKey.roles(guildId));
    }

    async setRolePositions(
      guildId: string,
      positions: { roleId: string; position: number }[],
      reason?: string,
    ): Promise<RoleDetail[]> {
      const roles = (await this.restClient().patch(Routes.guildRoles(guildId), {
        body: positions.map((p) => ({ id: p.roleId, position: p.position })),
        reason,
      })) as APIRoleLite[];
      bustDiscordCache(discordCacheKey.roles(guildId));
      return roles
        .filter((r) => r.id !== guildId)
        .map(toRoleDetail)
        .sort((a, b) => b.position - a.position);
    }
  };
}
