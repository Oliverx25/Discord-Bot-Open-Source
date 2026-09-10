/** Cookie JS-readable: guild activo del panel. No es secreto. */
export const GUILD_COOKIE = "tobot_guild";
export const GUILD_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function readGuildIdFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${GUILD_COOKIE}=`)) continue;
    const raw = trimmed.slice(GUILD_COOKIE.length + 1);
    try {
      const value = decodeURIComponent(raw);
      return value || null;
    } catch {
      return raw || null;
    }
  }
  return null;
}

export function writeGuildCookie(id: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${GUILD_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=${GUILD_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearGuildCookie(): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${GUILD_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
