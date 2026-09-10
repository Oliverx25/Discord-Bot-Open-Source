import { atom } from "nanostores";
import { clearGuildCookie, writeGuildCookie } from "@/lib/guildCookie";

export const GUILD_STORAGE_KEY = "tobot-guild-id";
const LEGACY_GUILD_STORAGE_KEY = "adobos-guild-id";

function readStoredGuildId(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(GUILD_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_GUILD_STORAGE_KEY)
  );
}

export const $guildId = atom<string | null>(readStoredGuildId());

export function getSelectedGuildId(): string | null {
  if (typeof window === "undefined") return $guildId.get();
  return readStoredGuildId();
}

export function setSelectedGuildId(id: string): void {
  window.localStorage.setItem(GUILD_STORAGE_KEY, id);
  window.localStorage.removeItem(LEGACY_GUILD_STORAGE_KEY);
  writeGuildCookie(id);
  $guildId.set(id);
}

export function clearSelectedGuildId(): void {
  window.localStorage.removeItem(GUILD_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_GUILD_STORAGE_KEY);
  clearGuildCookie();
  $guildId.set(null);
}
