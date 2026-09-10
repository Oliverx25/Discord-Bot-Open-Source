import {
  SIGNED_IN_HINT_COOKIE,
  SIGNED_IN_HINT_MAX_AGE_SEC,
  type MeResponse,
  type PanelMeUser,
  type SessionUserResponse,
} from "@adobos/shared";
import { API_BASE, apiFetch, readApiError } from "./client";

export async function fetchMe(): Promise<MeResponse> {
  const response = await apiFetch("/api/me");
  if (!response.ok) {
    throw new Error(
      await readApiError(response, `No autenticado (${response.status})`),
    );
  }
  return response.json() as Promise<MeResponse>;
}

/**
 * Probe silencioso para el landing: 401 no redirige a /login.
 * No usa `apiFetch` a propósito.
 */
export async function fetchSessionUser(): Promise<PanelMeUser | null> {
  try {
    const response = await fetch(`${API_BASE}/api/me/user`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as SessionUserResponse;
    if (!body.user?.id) return null;
    return body.user;
  } catch {
    return null;
  }
}

function hintCookieSecureFlag(): string {
  return window.location.protocol === "https:" ? "; Secure" : "";
}

function setSignedInDataset(on: boolean): void {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.dataset.signedIn = "1";
  else delete document.documentElement.dataset.signedIn;
}

export function writeSignedInHint(): void {
  if (typeof document === "undefined") return;
  setSignedInDataset(true);
  // biome-ignore lint/suspicious/noDocumentCookie: hint cookie is readable by design
  document.cookie = `${SIGNED_IN_HINT_COOKIE}=1; Path=/; Max-Age=${SIGNED_IN_HINT_MAX_AGE_SEC}; SameSite=Lax${hintCookieSecureFlag()}`;
}

export function clearSignedInHint(): void {
  if (typeof document === "undefined") return;
  setSignedInDataset(false);
  // La sesión real es HttpOnly; esto solo borra el hint de UX.
  // biome-ignore lint/suspicious/noDocumentCookie: hint cookie is readable by design
  document.cookie = `${SIGNED_IN_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${hintCookieSecureFlag()}`;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
  clearSignedInHint();
}
