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
  pinned: boolean;
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
  pinned: boolean;
}

/** Envío/edición/borrado de mensajes y reacciones. */
export interface MessagingGateway {
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
  /** Borra un lote de mensajes por id (<14 días, 1–100). Best-effort. */
  bulkDeleteMessageIds(
    channelId: string,
    messageIds: string[],
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
}
