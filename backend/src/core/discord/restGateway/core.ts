import { CDN } from "@discordjs/rest";
import { Routes } from "discord.js";
import { cache } from "#core/cache/store.js";
import { env } from "#core/env.js";
import { BaseGateway } from "../baseGateway.js";
import { DISCORD_CACHE_TTL, discordCacheKey } from "../discordCache.js";

export const cdn = new CDN();
export const AVATAR = { extension: "png", size: 256 } as const;

export interface APIUser {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
  avatar?: string | null;
  banner?: string | null;
  bot?: boolean;
}

export interface APIRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
  hoist: boolean;
  mentionable: boolean;
  tags?: { premium_subscriber_role?: unknown };
}

export interface APIChannel {
  id: string;
  name?: string | null;
  type: number;
  parent_id?: string | null;
  position?: number;
  topic?: string | null;
  rate_limit_per_user?: number;
  nsfw?: boolean;
  guild_id?: string;
  permission_overwrites?: {
    id: string;
    type: number;
    allow: string;
    deny: string;
  }[];
}

export interface APIMember {
  user: APIUser;
  nick?: string | null;
  avatar?: string | null;
  banner?: string | null;
  roles: string[];
  joined_at: string;
  communication_disabled_until?: string | null;
}

export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function displayName(user: APIUser, nick?: string | null): string {
  return nick || user.global_name || user.username;
}

export function userAvatarUrl(user: APIUser): string {
  if (user.avatar) return cdn.avatar(user.id, user.avatar, AVATAR);
  const index = user.discriminator
    ? Number(user.discriminator) % 5
    : Number((BigInt(user.id) >> 22n) % 6n);
  return cdn.defaultAvatar(index);
}

export function userBannerUrl(user: APIUser): string | null {
  if (!user.banner) return null;
  const ext = user.banner.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${ext}?size=480`;
}

export function memberAvatarUrl(guildId: string, member: APIMember): string {
  if (member.avatar) {
    return cdn.guildMemberAvatar(
      guildId,
      member.user.id,
      member.avatar,
      AVATAR,
    );
  }
  return userAvatarUrl(member.user);
}

/** URL del banner específico de un miembro dentro de un servidor. */
export function memberBannerUrl(
  guildId: string,
  member: APIMember,
): string | null {
  if (!member.banner) return null;
  const ext = member.banner.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/guilds/${guildId}/users/${member.user.id}/banners/${member.banner}.${ext}?size=480`;
}

/**
 * Núcleo compartido de `RestGateway`: caché read-through + los tres fetches
 * REST crudos (roles/canal/miembro) que reutilizan varias capacidades a la
 * vez (p. ej. `guildRoles` lo usan `listRoles`, `getMember`,
 * `getRoleAdminContext` y `botHasGuildPermission`).
 *
 * Públicos (no `protected`): aunque esta es una clase con nombre, un mixin
 * que hereda de ella y se exporta como clase anónima (`class extends Base`)
 * vuelve a disparar TS4094 en cuanto ese tipo anónimo expone en su superficie
 * un miembro `protected` **heredado** — no solo los declarados en el propio
 * cuerpo. Con `declaration: true` no hay forma de mantenerlos `protected` y
 * componerlos vía mixins a la vez.
 */
export class RestGatewayCore extends BaseGateway {
  isReady(): boolean {
    return true;
  }

  /**
   * Read-through: L1 (por proceso) + L2 (Redis) vía `CacheStore`. En miss llama
   * `loader` (REST) y cachea. `null` es un valor cacheable válido (canal/guild
   * inexistente) — se distingue de `undefined` (miss).
   */
  async cached<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const hit = await cache().get<T>(key);
    if (hit !== undefined) return hit;
    const value = await loader();
    await cache().set(key, value, ttlMs);
    return value;
  }

  async guildRoles(guildId: string): Promise<APIRole[]> {
    return (await this.restClient().get(
      Routes.guildRoles(guildId),
    )) as APIRole[];
  }

  async rawMember(guildId: string, userId: string): Promise<APIMember | null> {
    // GET /guilds/:guildId/members/:userId no acepta "@me". Ese alias solo
    // existe en endpoints específicos de "current member" (por ejemplo PATCH).
    // En el rol API no hay Client vivo, así que el Client ID de la aplicación
    // —que Discord asigna también al usuario bot— es la identidad estable.
    const resolvedUserId = userId === "@me" ? env().DISCORD_CLIENT_ID : userId;
    try {
      return (await this.restClient().get(
        Routes.guildMember(guildId, resolvedUserId),
      )) as APIMember;
    } catch {
      return null;
    }
  }

  async currentUser(): Promise<APIUser> {
    return (await this.restClient().get(Routes.user("@me"))) as APIUser;
  }

  async channelInGuild(
    guildId: string,
    channelId: string,
  ): Promise<APIChannel | null> {
    // Se cachea el canal **crudo** por channelId (pre-filtro de guild): un canal
    // pertenece a un solo guild, así que la clave no colisiona entre guilds.
    const raw = await this.cached<APIChannel | null>(
      discordCacheKey.channel(channelId),
      DISCORD_CACHE_TTL.channel,
      async () => {
        try {
          return (await this.restClient().get(
            Routes.channel(channelId),
          )) as APIChannel;
        } catch {
          return null;
        }
      },
    );
    if (!raw) return null;
    if (raw.guild_id && raw.guild_id !== guildId) return null;
    return raw;
  }
}
