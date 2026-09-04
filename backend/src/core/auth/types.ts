import type { FeatureKey, LimitKey, PlanTier } from "@adobos/shared";

export interface PanelUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  avatarUrl: string | null;
}

export interface ManagedGuild {
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  owner: boolean;
  /**
   * Bitfield de permisos base (rol) que Discord ya computa para este usuario
   * en el guild — string decimal, sin overwrites de canal. Fuente para
   * `core/authz/guildPolicy.ts`; nunca se expone tal cual al frontend.
   */
  permissions: string;
}

export interface GuildContext {
  guildId: string;
  userId: string;
  tier: PlanTier;
  can: (feature: FeatureKey) => boolean;
  limit: (key: LimitKey) => number;
}

export interface StoredSession {
  id: string;
  userId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  accessExpiresAt: Date | null;
  expiresAt: Date;
}

export const SESSION_COOKIE = "adobos_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const GUILD_CACHE_TTL_MS = 60 * 1000;

/** Bit ManageGuild de Discord. */
export const MANAGE_GUILD_BIT = 1n << 5n;
export const ADMINISTRATOR_BIT = 1n << 3n;
