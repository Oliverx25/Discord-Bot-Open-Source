import type { PanelMeUser, SessionUserResponse } from "@adobos/shared";
import { apiOrigin } from "./origin";
import { SESSION_USER_HEADER } from "./session-header";

const SESSION_TIMEOUT_MS = 2500;

function userFromPayload(value: unknown): PanelMeUser | null {
  if (!value || typeof value !== "object") return null;
  const user = value as PanelMeUser;
  return user.id ? user : null;
}

/** En `astro dev`, Vite ya resolvió la sesión en Node (workerd no alcanza Docker DNS). */
function injectedDevUser(request: Request): PanelMeUser | null {
  if (!import.meta.env.DEV) return null;
  const raw = request.headers.get(SESSION_USER_HEADER);
  if (!raw) return null;
  try {
    return userFromPayload(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
}

/** Lee la cookie HttpOnly contra Express. No guarda sesión en Astro. */
export async function getSessionUser(
  request: Request,
  locals?: App.Locals,
): Promise<PanelMeUser | null> {
  const injected = injectedDevUser(request);
  if (injected) return injected;

  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
  try {
    const response = await fetch(`${apiOrigin(locals)}/api/me/user`, {
      headers: {
        Accept: "application/json",
        Cookie: cookie,
      },
      redirect: "manual",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as SessionUserResponse;
    return userFromPayload(body.user);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
