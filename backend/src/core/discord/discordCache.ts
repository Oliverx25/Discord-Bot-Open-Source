/**
 * Claves y TTLs de la caché read-through que usa `RestGateway` (rol `api`).
 *
 * Solo se cachean lecturas **caras y de cambio lento** (resumen de guild, listas
 * de canales / roles / emojis / stickers, perfil del bot). Los miembros,
 * mensajes, bans, audit log y la "actionability" **no** se cachean: necesitan
 * frescura por request.
 *
 * `LocalClientGateway` (roles `all` / `gateway`) NO pasa por aquí — lee la caché
 * viva del `Client`. Estas claves las invalida `BaseGateway` en cada escritura
 * relacionada y, a partir de la Fase 5, las reescribe el gateway como warmer.
 * `RedisStore.del` publica la invalidación por pub/sub, así que todas las
 * réplicas `api` (y el `gateway`) descartan su copia L1.
 */

const P = "disc";

export const discordCacheKey = {
  guild: (guildId: string) => `${P}:guild:${guildId}`,
  channels: (guildId: string) => `${P}:channels:${guildId}`,
  channel: (channelId: string) => `${P}:channel:${channelId}`,
  roles: (guildId: string) => `${P}:roles:${guildId}`,
  emojis: (guildId: string) => `${P}:emojis:${guildId}`,
  stickers: (guildId: string) => `${P}:stickers:${guildId}`,
  botProfile: (guildId: string) => `${P}:botprofile:${guildId}`,
  botGuildIds: () => `${P}:botguilds`,
} as const;

/** TTLs conservadores (ms). Bajan a ~0 de staleness cuando entre el warmer (Fase 5). */
export const DISCORD_CACHE_TTL = {
  guild: 30_000,
  channels: 30_000,
  channel: 30_000,
  roles: 30_000,
  emojis: 60_000,
  stickers: 60_000,
  botProfile: 30_000,
  botGuildIds: 60_000,
} as const;
