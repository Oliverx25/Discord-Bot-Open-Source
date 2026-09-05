/** Un cambio dentro de una entrada de audit log (valores crudos de Discord). */
export interface AuditLogChange {
  key: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/** Usuario referenciado por el audit log (ejecutor u objetivo). */
export interface AuditLogUserRef {
  id: string;
  username: string;
  globalName: string | null;
  displayName: string;
  avatarUrl: string;
}

/** Una entrada de audit log — datos planos, sin resolver nombres de entidades. */
export interface AuditLogEntryData {
  id: string;
  /** `AuditLogEvent` numérico. */
  actionType: number;
  executorId: string | null;
  targetId: string | null;
  reason: string | null;
  /** ISO8601 (derivado del snowflake). */
  createdAt: string;
  changes: AuditLogChange[];
}

export interface AuditLogPage {
  entries: AuditLogEntryData[];
  /** Usuarios referenciados en la página (para resolver ejecutor/objetivo). */
  users: AuditLogUserRef[];
}

/** Moderación de miembros (moderation /action). */
export interface ModerationGateway {
  banMember(
    guildId: string,
    userId: string,
    opts?: { reason?: string; deleteMessageSeconds?: number },
  ): Promise<void>;
  unbanMember(guildId: string, userId: string, reason?: string): Promise<void>;
  kickMember(guildId: string, userId: string, reason?: string): Promise<void>;
  /** Añade un rol a un miembro. No-op si ya lo tiene. */
  addMemberRole(
    guildId: string,
    userId: string,
    roleId: string,
    reason?: string,
  ): Promise<void>;
  /** Quita un rol de un miembro. No-op si no lo tiene. */
  removeMemberRole(
    guildId: string,
    userId: string,
    roleId: string,
    reason?: string,
  ): Promise<void>;
  /** `until` = ISO8601, o `null` para quitar el timeout. */
  timeoutMember(
    guildId: string,
    userId: string,
    until: string | null,
    reason?: string,
  ): Promise<void>;
  setChannelSlowmode(
    guildId: string,
    channelId: string,
    seconds: number,
    reason?: string,
  ): Promise<void>;
  /** Crea un invite de un canal. `null` si Discord lo rechaza (permisos). */
  createInvite(
    channelId: string,
    opts?: {
      maxUses?: number;
      maxAgeSeconds?: number;
      unique?: boolean;
      reason?: string;
    },
  ): Promise<string | null>;
  /**
   * Audit log de Discord (crudo). Lanza `BotGatewayError` 403 `MISSING_PERMISSIONS`
   * si el bot no tiene «View Audit Log».
   */
  fetchAuditLog(
    guildId: string,
    opts?: { limit?: number; userId?: string; actionType?: number },
  ): Promise<AuditLogPage>;
}
