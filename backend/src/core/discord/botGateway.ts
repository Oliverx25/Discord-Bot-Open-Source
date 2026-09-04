/**
 * Puerto entre el panel HTTP y Discord. Las rutas hablan con este contrato en
 * vez de con el `Client` de discord.js, para que el rol `api` pueda servir sin
 * un gateway vivo (adaptador REST) mientras `all` / `gateway` usan el Client
 * (`LocalClientGateway`). Devuelve **datos planos** — ningún tipo discord.js
 * cruza la frontera.
 *
 * Cubre lecturas y escrituras. Las escrituras son una única implementación REST
 * en `BaseGateway` (heredada por ambos adaptadores); las lecturas las resuelve
 * cada adaptador a su manera (caché del Client vivo / REST + Redis).
 */

export interface GuildSummary {
  id: string;
  name: string;
  iconUrl: string | null;
  /** Rol de "booster" del guild, si existe. */
  boosterRoleId: string | null;
}

export interface ChannelSummary {
  id: string;
  name: string;
  /** `ChannelType` numérico de discord-api-types. */
  type: number;
  parentId: string | null;
  position: number;
}

export interface RoleSummary {
  id: string;
  name: string;
  color: number;
  hexColor: string;
  position: number;
  managed: boolean;
}

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

/** Perfil del bot en un guild (apodo + avatar de servidor). */
export interface BotProfileSummary {
  guildId: string;
  guildName: string;
  nickname: string;
  displayName: string;
  username: string;
  tag: string;
  serverAvatarUrl: string | null;
  globalAvatarUrl: string;
  hasServerAvatar: boolean;
}

export interface EmojiSummary {
  id: string;
  name: string;
  animated: boolean;
  url: string;
}

export interface StickerSummary {
  id: string;
  name: string;
  description: string | null;
  format: string;
  url: string;
}

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

export interface ChannelDetail extends ChannelSummary {
  topic: string | null;
  slowmodeSeconds: number;
  nsfw: boolean;
}

/** Un permission overwrite de canal. `allow`/`deny` son bitfields como string. */
export interface ChannelOverwrite {
  id: string;
  /** 0 = rol, 1 = miembro. */
  type: number;
  allow: string;
  deny: string;
}

/** Alta de un canal de guild (tickets). */
export interface CreateChannelInput {
  name: string;
  /** `ChannelType` numérico. */
  type: number;
  parentId?: string | null;
  topic?: string;
  permissionOverwrites?: {
    id: string;
    type: number;
    allow?: string;
    deny?: string;
  }[];
  reason?: string;
}

/** Mensaje de un canal con los campos que necesitan tickets (transcript / panel). */
export interface ChannelMessageBrief {
  id: string;
  authorId: string;
  /** `username#discriminator`, o solo `username` si no tiene discriminator. */
  authorTag: string;
  authorIsBot: boolean;
  content: string;
  /** ISO8601. */
  createdAt: string;
  attachmentCount: number;
  hasComponents: boolean;
}

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

export interface FetchedMessageEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: string;
  authorName?: string;
  authorIconUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
  footerIconUrl?: string;
  timestamp: boolean;
}

export interface FetchedMessageReaction {
  emojiKey: string;
  name: string | null;
  id: string | null;
  animated: boolean;
  imageUrl: string | null;
  count: number;
}

export interface FetchedMessage {
  id: string;
  channelId: string;
  content: string;
  embeds: FetchedMessageEmbed[];
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  isBotAuthor: boolean;
  reactions: FetchedMessageReaction[];
}

/**
 * Contenido de un mensaje a enviar/editar. `embeds` / `components` van ya en
 * JSON (p. ej. `EmbedBuilder.toJSON()`), no como builders. Los adjuntos se pasan
 * como buffers con nombre.
 */
export interface OutgoingMessage {
  content?: string;
  embeds?: unknown[];
  components?: unknown[];
  files?: { name: string; data: Buffer }[];
  allowedMentions?: unknown;
}

/** Error del puerto con forma HTTP (status + code), como los errores de módulo. */
export class BotGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "BotGatewayError";
  }
}

/**
 * URLs de media resueltas del primer embed **ya publicado** — sirven para
 * persistir `attachment://` como la URL CDN definitiva. `undefined` = sin embed.
 */
export interface PublishedEmbedMedia {
  authorIconUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerIconUrl?: string;
}

export interface SentMessageResult {
  messageId: string;
  channelId: string;
  embedMedia?: PublishedEmbedMedia;
}

export interface EditMessageResult {
  orphaned: boolean;
  embedMedia?: PublishedEmbedMedia;
}

/** Regla de AutoMod nativo de Discord (resumen para el diffing del sync). */
export interface AutoModRuleSummary {
  id: string;
  name: string;
  enabled: boolean;
  /** `AutoModerationRuleEventType` numérico. */
  eventType: number;
  /** `AutoModerationRuleTriggerType` numérico. */
  triggerType: number;
}

/** Acción de una regla de AutoMod (`type` = `AutoModerationActionType`). */
export interface AutoModRuleAction {
  type: number;
  /** Mensaje custom para `BlockMessage`. */
  customMessage?: string;
}

/** Alta/edición de una regla de AutoMod nativo — datos planos. */
export interface AutoModRuleInput {
  name: string;
  enabled: boolean;
  eventType: number;
  triggerType: number;
  keywordFilter?: string[];
  regexPatterns?: string[];
  mentionTotalLimit?: number;
  mentionRaidProtectionEnabled?: boolean;
  actions: AutoModRuleAction[];
  exemptRoles?: string[];
  exemptChannels?: string[];
  reason?: string;
}

export interface BotGateway {
  /** El gateway/Client está conectado. El adaptador REST devuelve siempre true. */
  isReady(): boolean;
  /** `null` si el bot no está en ese guild (o aún no está cacheado). */
  getGuild(guildId: string): Promise<GuildSummary | null>;
  listChannels(guildId: string): Promise<ChannelSummary[]>;
  listRoles(guildId: string): Promise<RoleSummary[]>;
  listEmojis(guildId: string): Promise<EmojiSummary[]>;
  listStickers(guildId: string): Promise<StickerSummary[]>;
  /** Un canal del guild. `null` si no existe o no pertenece a ese guild. */
  getChannel(
    guildId: string,
    channelId: string,
  ): Promise<ChannelSummary | null>;
  /** Borra un canal del guild. No-op si ya no existe. */
  deleteChannel(
    guildId: string,
    channelId: string,
    reason?: string,
  ): Promise<void>;
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
  getChannelDetail(
    guildId: string,
    channelId: string,
  ): Promise<ChannelDetail | null>;
  /**
   * Un mensaje de un canal de texto del guild (vista previa del panel).
   * Lanza `BotGatewayError` con `code` según el motivo (canal/mensaje no
   * encontrado, sin acceso, tipo inválido).
   */
  fetchMessage(
    guildId: string,
    channelId: string,
    messageId: string,
  ): Promise<FetchedMessage>;
  /**
   * Envía un mensaje a un canal del guild. Lanza `BotGatewayError` si el canal
   * no existe, no es de este guild o no admite mensajes.
   */
  sendMessage(
    guildId: string,
    channelId: string,
    message: OutgoingMessage,
  ): Promise<SentMessageResult>;
  /**
   * Edita un mensaje del bot. `orphaned` si Discord ya no lo tiene (10008).
   */
  editMessage(
    guildId: string,
    channelId: string,
    messageId: string,
    message: OutgoingMessage,
  ): Promise<EditMessageResult>;
  /** Borra un mensaje. `orphaned` si ya no existía (10008). */
  deleteMessage(
    guildId: string,
    channelId: string,
    messageId: string,
  ): Promise<{ orphaned: boolean }>;
  /**
   * Reacción del bot a un mensaje. `emoji` = unicode (`👍`) o `nombre:id` para
   * custom. Best-effort: no lanza si no se pudo (permisos, mensaje borrado).
   */
  addReaction(
    channelId: string,
    messageId: string,
    emoji: string,
  ): Promise<void>;
  /** Quita todas las reacciones de un mensaje. Best-effort. */
  clearReactions(channelId: string, messageId: string): Promise<void>;
  /**
   * DM a un usuario. Best-effort: no lanza si el usuario tiene los DMs cerrados
   * o no se puede resolver. `sent` indica si llegó.
   */
  sendDirectMessage(
    userId: string,
    message: OutgoingMessage,
  ): Promise<{ sent: boolean }>;

  // — Administración de roles (editor del panel) —
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

  // — Webhooks (action-logs) —
  listChannelWebhooks(
    channelId: string,
  ): Promise<{ id: string; name: string; token: string | null }[]>;
  createChannelWebhook(
    channelId: string,
    name: string,
    reason?: string,
  ): Promise<{ id: string; token: string }>;
  /** Ejecuta un webhook. Lanza `BotGatewayError` 404 `UNKNOWN_WEBHOOK` si Discord ya no lo tiene. */
  executeWebhook(
    webhookId: string,
    token: string,
    payload: OutgoingMessage & { username?: string; avatarUrl?: string },
  ): Promise<{ messageId: string }>;

  // — Moderación de miembros (moderation /action) —
  /** Jerarquía + permisos del bot sobre un miembro. `null` si no es miembro del guild. */
  getMemberActionability(
    guildId: string,
    userId: string,
  ): Promise<MemberActionability | null>;
  banMember(
    guildId: string,
    userId: string,
    opts?: { reason?: string; deleteMessageSeconds?: number },
  ): Promise<void>;
  unbanMember(guildId: string, userId: string, reason?: string): Promise<void>;
  kickMember(guildId: string, userId: string, reason?: string): Promise<void>;
  /** `until` = ISO8601, o `null` para quitar el timeout. */
  timeoutMember(
    guildId: string,
    userId: string,
    until: string | null,
    reason?: string,
  ): Promise<void>;
  /**
   * Borra hasta `limit` mensajes recientes (<14 días) de un canal.
   * `filterUserId` acota a un autor. Devuelve cuántos borró.
   */
  bulkDeleteMessages(
    channelId: string,
    opts: { limit: number; filterUserId?: string | null },
  ): Promise<number>;
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

  // — Overwrites de canal (anti-raid lockdown, tickets) —
  /** Overwrites de un canal del guild. `null` si el canal no existe / no es del guild. */
  getChannelOverwrites(
    guildId: string,
    channelId: string,
  ): Promise<ChannelOverwrite[] | null>;
  /** PUT absoluto de un overwrite (rol o miembro) — reemplaza allow/deny. */
  putChannelOverwrite(
    channelId: string,
    overwriteId: string,
    input: { type: number; allow: string; deny: string; reason?: string },
  ): Promise<void>;
  /** Quita un overwrite del canal. No-op si no existía. */
  deleteChannelOverwrite(
    channelId: string,
    overwriteId: string,
    reason?: string,
  ): Promise<void>;
  /** Reemplaza **todos** los overwrites del canal. */
  setChannelOverwrites(
    channelId: string,
    overwrites: ChannelOverwrite[],
    reason?: string,
  ): Promise<void>;

  // — Canales / mensajes (tickets) —
  /** ID del usuario del bot. */
  getBotUserId(): Promise<string>;
  createChannel(
    guildId: string,
    input: CreateChannelInput,
  ): Promise<ChannelSummary>;
  /** Fija un mensaje. Best-effort. */
  pinMessage(
    channelId: string,
    messageId: string,
    reason?: string,
  ): Promise<void>;
  /** Últimos mensajes de un canal (paginable con `before`). */
  listChannelMessages(
    channelId: string,
    opts?: { limit?: number; before?: string },
  ): Promise<ChannelMessageBrief[]>;

  // — AutoMod nativo (auto-mod) —
  /** ¿El bot tiene ese permiso a nivel de guild? `permission` = bit de `PermissionFlagsBits`. */
  botHasGuildPermission(guildId: string, permission: bigint): Promise<boolean>;
  listAutoModRules(guildId: string): Promise<AutoModRuleSummary[]>;
  createAutoModRule(guildId: string, rule: AutoModRuleInput): Promise<void>;
  editAutoModRule(
    guildId: string,
    ruleId: string,
    rule: AutoModRuleInput,
  ): Promise<void>;
  deleteAutoModRule(
    guildId: string,
    ruleId: string,
    reason?: string,
  ): Promise<void>;

  // — Perfil del bot en el guild —
  getBotProfile(guildId: string): Promise<BotProfileSummary>;
  /** `null` para quitar el apodo. */
  setBotGuildNickname(guildId: string, nickname: string | null): Promise<void>;
  /** `Buffer` (imagen), URL http(s), o `null` para limpiar. */
  setBotGuildAvatar(
    guildId: string,
    avatar: Buffer | string | null,
  ): Promise<void>;
}
