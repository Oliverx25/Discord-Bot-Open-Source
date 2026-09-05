import { Routes } from "discord.js";
import { safeImageFetch } from "#core/http/safeImageFetch.js";
import { discordCacheKey } from "../discordCache.js";
import {
  bustDiscordCache,
  type Constructor,
  type RestClientCore,
} from "./core.js";

const MAGIC: [string, number[]][] = [
  ["image/png", [0x89, 0x50, 0x4e, 0x47]],
  ["image/gif", [0x47, 0x49, 0x46]],
  ["image/webp", [0x52, 0x49, 0x46, 0x46]],
  ["image/jpeg", [0xff, 0xd8, 0xff]],
];

/**
 * SEC-02: `avatar` puede venir de `serverAvatarUrl` (panel, string http(s)
 * arbitraria) — nunca `fetch()` directo. `safeImageFetch` bloquea SSRF,
 * limita tamaño/redirects y ya valida magic bytes reales.
 */
async function toImageDataUri(avatar: Buffer | string): Promise<string> {
  if (typeof avatar === "string") {
    const { buffer, contentType } = await safeImageFetch(avatar, {
      maxBytes: 8 * 1024 * 1024,
      timeoutMs: 12_000,
    });
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }
  const mime =
    MAGIC.find(([, sig]) => sig.every((b, i) => avatar[i] === b))?.[0] ??
    "image/png";
  return `data:${mime};base64,${avatar.toString("base64")}`;
}

/** Perfil del bot en el guild (apodo/avatar de servidor) — implementación REST compartida. */
export function BotProfileMixin<TBase extends Constructor<RestClientCore>>(
  Base: TBase,
) {
  return class extends Base {
    async setBotGuildNickname(
      guildId: string,
      nickname: string | null,
    ): Promise<void> {
      await this.restClient().patch(Routes.guildMember(guildId, "@me"), {
        body: { nick: nickname },
      });
      bustDiscordCache(discordCacheKey.botProfile(guildId));
    }

    async setBotGuildAvatar(
      guildId: string,
      avatar: Buffer | string | null,
    ): Promise<void> {
      const body =
        avatar === null
          ? { avatar: null }
          : { avatar: await toImageDataUri(avatar) };
      await this.restClient().patch(Routes.guildMember(guildId, "@me"), {
        body,
      });
      bustDiscordCache(discordCacheKey.botProfile(guildId));
    }
  };
}
