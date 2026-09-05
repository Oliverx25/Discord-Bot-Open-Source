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

export interface ChannelDetail extends ChannelSummary {
  topic: string | null;
  slowmodeSeconds: number;
  nsfw: boolean;
}

/** Hilo activo de un guild (auto-delete SCHEDULED). */
export interface ActiveThread {
  id: string;
  parentId: string | null;
  /** `ChannelType` numérico. */
  type: number;
}

/** Lecturas de guild/canal/rol/emoji que no dependen de un miembro concreto. */
export interface GuildReadsGateway {
  /** IDs de todos los guilds donde está el bot (para el selector del panel). */
  getBotGuildIds(): Promise<string[]>;
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
  getChannelDetail(
    guildId: string,
    channelId: string,
  ): Promise<ChannelDetail | null>;
  /** Hilos activos del guild (para barridos de auto-delete). */
  listActiveThreads(guildId: string): Promise<ActiveThread[]>;
  /** ¿El bot tiene ese permiso a nivel de guild? `permission` = bit de `PermissionFlagsBits`. */
  botHasGuildPermission(guildId: string, permission: bigint): Promise<boolean>;
}
