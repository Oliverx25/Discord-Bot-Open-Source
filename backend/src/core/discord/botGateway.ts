/**
 * Puerto entre el panel HTTP y Discord. Las rutas hablan con este contrato en
 * vez de con el `Client` de discord.js, para que el rol `api` pueda servir sin
 * un gateway vivo (adaptador REST) mientras `all` / `gateway` usan el Client
 * (`LocalClientGateway`). Devuelve **datos planos** — ningún tipo discord.js
 * cruza la frontera.
 *
 * Se amplía por oleadas: hoy cubre las lecturas de guild-assets.
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
