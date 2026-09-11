import { type Client, Events } from "discord.js";
import { cache } from "#core/cache/store.js";
import { logger } from "#core/log.js";
import type { BotGateway } from "./botGateway.js";
import { DISCORD_CACHE_WARM_TTL, discordCacheKey } from "./discordCache.js";

/**
 * Cache warmer del rol `gateway`: cuando algo cambia en Discord, reescribe el
 * snapshot fresco en las **mismas claves Redis** que lee `RestGateway`
 * (`discordCache.ts`). Así, en estado estacionario, los hits de `api` son
 * calientes y solo se pega a REST en arranque en frío o evicción.
 *
 * Solo reacciona a **cambios** — no calienta en el burst de `GuildCreate` del
 * arranque (guilds que nadie está mirando en el panel).
 */
export function installCacheWarmer(client: Client, gateway: BotGateway): void {
  async function warm<T>(key: string, load: () => Promise<T>): Promise<void> {
    try {
      const value = await load();
      await cache().set(key, value, DISCORD_CACHE_WARM_TTL);
    } catch (error) {
      logger.debug({ err: error, key }, "cache-warmer: warm falló");
    }
  }

  function drop(...keys: string[]): void {
    for (const key of keys) {
      void cache()
        .del(key)
        .catch(() => undefined);
    }
  }

  function warmGuildCore(guildId: string): void {
    void warm(discordCacheKey.guild(guildId), () => gateway.getGuild(guildId));
    void warm(discordCacheKey.channels(guildId), () =>
      gateway.listChannels(guildId),
    );
    void warm(discordCacheKey.roles(guildId), () => gateway.listRoles(guildId));
  }

  client.on(Events.GuildUpdate, (_old, guild) => {
    void warm(discordCacheKey.guild(guild.id), () =>
      gateway.getGuild(guild.id),
    );
  });

  client.on(Events.GuildCreate, (guild) => {
    // El bot se unió a un guild nuevo (no el burst de arranque).
    // La lista usada por /api/me también puede estar cacheada en el rol api.
    drop(discordCacheKey.botGuildIds());
    if (client.isReady()) warmGuildCore(guild.id);
  });

  client.on(Events.GuildDelete, (guild) => {
    drop(
      discordCacheKey.guild(guild.id),
      discordCacheKey.channels(guild.id),
      discordCacheKey.roles(guild.id),
      discordCacheKey.emojis(guild.id),
      discordCacheKey.stickers(guild.id),
      discordCacheKey.botProfile(guild.id),
    );
    drop(discordCacheKey.botGuildIds());
  });

  const onChannel = (channel: { guildId?: string | null; id: string }) => {
    if (!channel.guildId) return;
    void warm(discordCacheKey.channels(channel.guildId), () =>
      gateway.listChannels(channel.guildId as string),
    );
    drop(discordCacheKey.channel(channel.id));
  };
  client.on(Events.ChannelCreate, onChannel);
  client.on(Events.ChannelUpdate, (_old, channel) => {
    if ("guildId" in channel) onChannel(channel);
  });
  client.on(Events.ChannelDelete, (channel) => {
    if ("guildId" in channel) onChannel(channel);
  });

  const onRole = (role: { guild: { id: string } }) => {
    void warm(discordCacheKey.roles(role.guild.id), () =>
      gateway.listRoles(role.guild.id),
    );
  };
  client.on(Events.GuildRoleCreate, onRole);
  client.on(Events.GuildRoleUpdate, (_old, role) => onRole(role));
  client.on(Events.GuildRoleDelete, onRole);

  const onEmojis = (emoji: { guild: { id: string } }) => {
    void warm(discordCacheKey.emojis(emoji.guild.id), () =>
      gateway.listEmojis(emoji.guild.id),
    );
  };
  client.on(Events.GuildEmojiCreate, onEmojis);
  client.on(Events.GuildEmojiUpdate, (_old, emoji) => onEmojis(emoji));
  client.on(Events.GuildEmojiDelete, onEmojis);

  const onStickers = (sticker: { guild: { id: string } | null }) => {
    if (sticker.guild) {
      void warm(discordCacheKey.stickers(sticker.guild.id), () =>
        gateway.listStickers((sticker.guild as { id: string }).id),
      );
    }
  };
  client.on(Events.GuildStickerCreate, onStickers);
  client.on(Events.GuildStickerUpdate, (_old, sticker) => onStickers(sticker));
  client.on(Events.GuildStickerDelete, onStickers);

  client.on(Events.GuildMemberUpdate, (_old, member) => {
    if (member.id !== client.user?.id) return;
    void warm(discordCacheKey.botProfile(member.guild.id), () =>
      gateway.getBotProfile(member.guild.id),
    );
  });

  logger.info("cache-warmer: listeners de gateway instalados");
}
