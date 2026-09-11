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
  globalBannerUrl: string | null;
  serverBannerUrl: string | null;
  hasServerAvatar: boolean;
  /** Fecha en que Discord registró al bot como miembro del servidor. */
  joinedAt: string | null;
}

/** Perfil del bot en el guild (apodo/avatar de servidor). */
export interface BotProfileGateway {
  getBotProfile(guildId: string): Promise<BotProfileSummary>;
  /** `null` para quitar el apodo. */
  setBotGuildNickname(guildId: string, nickname: string | null): Promise<void>;
  /** `Buffer` (imagen), URL http(s), o `null` para limpiar. */
  setBotGuildAvatar(
    guildId: string,
    avatar: Buffer | string | null,
  ): Promise<void>;
  setBotGuildBanner(
    guildId: string,
    banner: Buffer | string | null,
  ): Promise<void>;
}
