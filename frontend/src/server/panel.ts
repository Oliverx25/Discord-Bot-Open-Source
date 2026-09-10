import type {
  MeResponse,
  PanelMeGuild,
  PlanTier,
  GuildEntitlements,
} from "@adobos/shared";
import { readGuildIdFromCookieHeader } from "../lib/guildCookie";
import { apiOrigin } from "./origin";
import { PANEL_CONTEXT_HEADER } from "./session-header";

const PANEL_TIMEOUT_MS = 4000;

export type PanelContext = {
  me: MeResponse;
  selectedGuild: PanelMeGuild | null;
  tier: PlanTier;
};

type InjectedPanel = {
  me: MeResponse;
  tier?: PlanTier;
};

function isMeResponse(value: unknown): value is MeResponse {
  if (!value || typeof value !== "object") return false;
  const me = value as MeResponse;
  return Boolean(me.user?.id && Array.isArray(me.guilds));
}

/** En `astro dev`, Vite ya resolvió /api/me en Node (workerd no alcanza Docker DNS). */
function injectedPanel(request: Request): InjectedPanel | null {
  if (!import.meta.env.DEV) return null;
  const raw = request.headers.get(PANEL_CONTEXT_HEADER);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as InjectedPanel;
    if (!isMeResponse(parsed.me)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function pickGuild(
  guilds: PanelMeGuild[],
  cookieHeader: string | null,
): PanelMeGuild | null {
  if (guilds.length === 0) return null;
  const wanted = readGuildIdFromCookieHeader(cookieHeader);
  return guilds.find((guild) => guild.id === wanted) ?? guilds[0] ?? null;
}

async function fetchJson(
  url: string,
  request: Request,
): Promise<unknown | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PANEL_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Cookie: cookie,
      },
      redirect: "manual",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTier(
  request: Request,
  locals: App.Locals | undefined,
  guildId: string,
): Promise<PlanTier> {
  const origin = apiOrigin(locals);
  const url = new URL("/api/entitlements", `${origin}/`);
  url.searchParams.set("guildId", guildId);
  const body = await fetchJson(url.toString(), request);
  const snapshot = body as GuildEntitlements | null;
  return snapshot?.tier ?? "free";
}

/**
 * Sesión del panel: user + guilds vía Express. Discord no se toca desde Astro.
 */
export async function loadPanelContext(
  request: Request,
  locals?: App.Locals,
): Promise<PanelContext | null> {
  const injected = injectedPanel(request);
  const cookie = request.headers.get("cookie");

  if (injected) {
    const selectedGuild = pickGuild(injected.me.guilds, cookie);
    const tier =
      injected.tier ??
      (selectedGuild
        ? await fetchTier(request, locals, selectedGuild.id)
        : "free");
    return { me: injected.me, selectedGuild, tier };
  }

  const origin = apiOrigin(locals);
  const body = await fetchJson(`${origin}/api/me`, request);
  if (!isMeResponse(body)) return null;

  const selectedGuild = pickGuild(body.guilds, cookie);
  const tier = selectedGuild
    ? await fetchTier(request, locals, selectedGuild.id)
    : "free";
  return { me: body, selectedGuild, tier };
}

export function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}
