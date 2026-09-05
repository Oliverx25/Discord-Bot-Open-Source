/** Nombre/avatar frescos de un miembro (o del usuario global si no es miembro). */
export interface MemberProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Datos de un miembro para las vistas de moderación (búsqueda, ficha). */
export interface MemberInfo {
  userId: string;
  username: string;
  globalName: string | null;
  displayName: string;
  avatarUrl: string;
  bot: boolean;
  joinedAt: string | null;
  timedOutUntil: string | null;
  roles: { id: string; name: string; hexColor: string }[];
}

/** Usuario global (fallback cuando no es miembro del guild). */
export interface UserInfo {
  userId: string;
  username: string;
  globalName: string | null;
  displayName: string;
  avatarUrl: string;
}

export interface GuildBanEntry {
  userId: string;
  username: string;
  globalName: string | null;
  displayName: string;
  avatarUrl: string;
  reason: string | null;
}

/** Jerarquía + permisos del bot sobre un miembro concreto (para `/action`). */
export interface MemberActionability {
  /** El objetivo es el propio bot. */
  isBot: boolean;
  /** El objetivo es el dueño del servidor. */
  isOwner: boolean;
  bannable: boolean;
  kickable: boolean;
  moderatable: boolean;
}

/** Lecturas de miembros/usuarios del guild. */
export interface MembersGateway {
  /**
   * Nombre/avatar frescos de varios usuarios (precarga por lotes). Clave = userId.
   * Prioriza el perfil de servidor (apodo / avatar Nitro) cuando el usuario es
   * miembro del guild.
   */
  resolveMembers(
    guildId: string,
    userIds: string[],
  ): Promise<Map<string, MemberProfile>>;
  /** Roster completo del guild (para búsqueda/ranking en memoria del módulo). */
  listMembers(guildId: string): Promise<MemberInfo[]>;
  getMember(guildId: string, userId: string): Promise<MemberInfo | null>;
  /** Usuario global — fallback para baneados / fuera del servidor. */
  getUser(userId: string): Promise<UserInfo | null>;
  listBans(guildId: string): Promise<GuildBanEntry[]>;
  /** Jerarquía + permisos del bot sobre un miembro. `null` si no es miembro del guild. */
  getMemberActionability(
    guildId: string,
    userId: string,
  ): Promise<MemberActionability | null>;
}
