/** Cliente HTTP base del panel (same-origin / proxy BFF). */
import type { ApiErrorBody } from "@adobos/shared";
import { getSelectedGuildId } from "@/stores/guild";

export { getSelectedGuildId, setSelectedGuildId, clearSelectedGuildId } from "@/stores/guild";

export const API_BASE = import.meta.env.PUBLIC_API_BASE ?? "";

export async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.error) return body.error;
  } catch {
    // ignore
  }
  return fallback;
}

function resolveUrl(path: string): URL {
  const href = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://127.0.0.1:3000";
  return new URL(href, origin);
}

function shouldAttachGuild(pathname: string): boolean {
  if (pathname.startsWith("/api/health")) return false;
  if (pathname.startsWith("/api/me")) return false;
  if (pathname.startsWith("/auth")) return false;
  return pathname.startsWith("/api/");
}

/** Fetch same-origin con cookie de sesión y guildId autorizado. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = resolveUrl(path);
  const guildId = getSelectedGuildId();
  if (shouldAttachGuild(url.pathname) && !url.searchParams.has("guildId")) {
    if (guildId) url.searchParams.set("guildId", guildId);
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (guildId && shouldAttachGuild(url.pathname) && !headers.has("X-Guild-Id")) {
    headers.set("X-Guild-Id", guildId);
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && typeof window !== "undefined") {
    const here = window.location.pathname;
    if (here !== "/" && !here.startsWith("/auth/")) {
      window.location.assign("/");
    }
  }

  return response;
}

/** Resuelve `/uploads/...` al origen del API para miniaturas en el panel. */
export function resolvePublicAssetUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return trimmed;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${API_BASE}${trimmed}`;
  }
  return trimmed;
}
