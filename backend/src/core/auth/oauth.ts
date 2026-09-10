import { createHash, randomBytes } from "node:crypto";
import { buildBotInviteUrl, SIGNED_IN_HINT_COOKIE } from "@adobos/shared";
import {
  type CookieOptions,
  type Request,
  type Response,
  Router,
} from "express";
import type { BotGateway } from "../discord/botGateway.js";
import { DiscordHttpError } from "../discord/discordHttpError.js";
import { logger } from "../log.js";
import { hashSessionId } from "./crypto.js";
import { listManagedGuilds } from "./discordGuilds.js";
import {
  consumeOauthState,
  createOauthState,
  createSession,
  deleteSession,
  getSession,
  toPanelUser,
  upsertPanelUser,
} from "./sessionStore.js";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_ALIASES,
  SESSION_TTL_MS,
} from "./types.js";

const DISCORD_API = "https://discord.com/api/v10";
const DISCORD_AUTHORIZE = "https://discord.com/oauth2/authorize";

function publicAppUrl(): string {
  const url = process.env.PUBLIC_APP_URL?.trim();
  if (!url) {
    throw new Error("PUBLIC_APP_URL is not defined.");
  }
  return url.replace(/\/$/, "");
}

function redirectUri(): string {
  return `${publicAppUrl()}/auth/discord/callback`;
}

function clientId(): string {
  const id = process.env.DISCORD_CLIENT_ID?.trim();
  if (!id) throw new Error("DISCORD_CLIENT_ID is not defined.");
  return id;
}

function clientSecret(): string {
  const secret = process.env.DISCORD_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("DISCORD_CLIENT_SECRET is not defined.");
  const botToken = process.env.DISCORD_TOKEN?.trim();
  if (botToken && secret === botToken) {
    throw new Error(
      "DISCORD_CLIENT_SECRET can't be the bot token. Use OAuth2 → Client Secret in the Discord portal.",
    );
  }
  return secret;
}

function cookieSecure(): boolean {
  return (
    SESSION_COOKIE.startsWith("__Host-") ||
    process.env.NODE_ENV === "production"
  );
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

/** Hint de UX para el landing: JS puede leerla; no autoriza nada. */
function signedInHintCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function sessionIdFrom(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  if (!cookies) return undefined;
  for (const name of SESSION_COOKIE_ALIASES) {
    const raw = cookies[name];
    if (typeof raw === "string" && raw.length > 0) return raw;
  }
  return undefined;
}

export function authRouter(): Router {
  const router = Router();

  router.get("/discord", async (_req, res) => {
    try {
      const { verifier, challenge } = pkcePair();
      const state = await createOauthState(verifier);
      const params = new URLSearchParams({
        client_id: clientId(),
        redirect_uri: redirectUri(),
        response_type: "code",
        scope: "identify guilds",
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
        prompt: "consent",
      });
      res.redirect(`${DISCORD_AUTHORIZE}?${params.toString()}`);
    } catch (error: unknown) {
      logger.error({ err: error }, "OAuth authorize failed:");
      res.redirect("/?error=oauth_config");
    }
  });

  /**
   * Invite del bot (scope bot + applications.commands).
   * No inicia sesión: Discord pide servidor y permisos, como MEE6.
   */
  router.get("/invite", (req, res) => {
    try {
      const raw = req.query.guildId;
      const guildId =
        typeof raw === "string" && /^\d{17,20}$/.test(raw.trim())
          ? raw.trim()
          : undefined;
      res.redirect(buildBotInviteUrl({ clientId: clientId(), guildId }));
    } catch (error: unknown) {
      logger.error({ err: error }, "OAuth invite failed:");
      res.redirect("/?error=oauth_config");
    }
  });

  router.get("/discord/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const oauthError =
      typeof req.query.error === "string" ? req.query.error : "";

    if (oauthError || !code || !state) {
      res.redirect("/?error=oauth_denied");
      return;
    }

    const verifier = await consumeOauthState(state);
    if (!verifier) {
      res.redirect("/?error=oauth_state");
      return;
    }

    try {
      const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId(),
          client_secret: clientSecret(),
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri(),
          code_verifier: verifier,
        }),
      });
      if (!tokenRes.ok) {
        const detail = await tokenRes.text();
        logger.error(
          { detail: [tokenRes.status, detail] },
          "Discord token error:",
        );
        const isClient =
          tokenRes.status === 401 || detail.includes("invalid_client");
        res.redirect(
          `/?error=${isClient ? "oauth_client" : "oauth_token"}`,
        );
        return;
      }
      const tokenJson = (await tokenRes.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      const accessToken = tokenJson.access_token;
      if (!accessToken) {
        res.redirect("/?error=oauth_token");
        return;
      }
      const accessExpiresAt =
        typeof tokenJson.expires_in === "number"
          ? new Date(Date.now() + tokenJson.expires_in * 1000)
          : null;

      const meRes = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!meRes.ok) {
        res.redirect("/?error=oauth_user");
        return;
      }
      const me = (await meRes.json()) as {
        id: string;
        username: string;
        global_name: string | null;
        avatar: string | null;
      };

      await upsertPanelUser({
        userId: me.id,
        username: me.username,
        globalName: me.global_name,
        avatar: me.avatar,
      });
      const sessionId = await createSession({
        userId: me.id,
        username: me.username,
        globalName: me.global_name,
        avatar: me.avatar,
        accessToken,
        refreshToken: tokenJson.refresh_token ?? null,
        accessExpiresAt,
      });
      res.cookie(SESSION_COOKIE, sessionId, cookieOptions());
      res.cookie(SIGNED_IN_HINT_COOKIE, "1", signedInHintCookieOptions());
      res.redirect("/dashboard");
    } catch (error: unknown) {
      logger.error({ err: error }, "OAuth callback failed:");
      res.redirect("/?error=oauth_callback");
    }
  });

  // AUTH-01: solo POST — un logout por GET es un CSRF de un solo link/imagen
  // (`sameSite=lax` todavía deja pasar la cookie en una navegación de nivel
  // superior). El panel ya solo llama a este POST (`frontend/src/lib/api/me.ts`).
  router.post("/logout", async (req, res) => {
    const sid = sessionIdFrom(req);
    if (sid) await deleteSession(hashSessionId(sid));
    for (const name of SESSION_COOKIE_ALIASES) {
      const hostPrefixed = name.startsWith("__Host-");
      res.clearCookie(name, {
        path: "/",
        secure: hostPrefixed || process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }
    res.clearCookie(SIGNED_IN_HINT_COOKIE, {
      path: "/",
      secure: cookieSecure(),
      sameSite: "lax",
    });
    res.status(204).end();
  });

  return router;
}

export function meRouter(gateway: BotGateway): Router {
  const router = Router();

  /** Usuario de la fila de sesión; no lista guilds ni llama a Discord. */
  router.get("/user", (req, res) => {
    const session = req.panelSession;
    if (!session) {
      res
        .status(401)
        .json({ error: "No autenticado.", code: "UNAUTHENTICATED" });
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ user: toPanelUser(session) });
  });

  router.get("/", async (req, res) => {
    const session = req.panelSession;
    if (!session) {
      res
        .status(401)
        .json({ error: "No autenticado.", code: "UNAUTHENTICATED" });
      return;
    }
    try {
      const managed = await listManagedGuilds(session);
      const inviteUrl = buildBotInviteUrl({ clientId: clientId() });
      const botGuildIds = new Set(
        await gateway.getBotGuildIds().catch(() => []),
      );
      const guilds = managed.map((guild) => ({
        id: guild.id,
        name: guild.name,
        iconUrl: guild.iconUrl,
        owner: guild.owner,
        botPresent: botGuildIds.has(guild.id),
      }));
      res.json({
        user: toPanelUser(session),
        guilds,
        inviteUrl,
      });
    } catch (error: unknown) {
      if (error instanceof DiscordHttpError && error.status === 401) {
        res
          .status(401)
          .json({ error: "Session expired.", code: "UNAUTHENTICATED" });
        return;
      }
      if (error instanceof DiscordHttpError && error.status === 429) {
        if (error.retryAfterSec) {
          res.setHeader("Retry-After", String(error.retryAfterSec));
        }
        res.status(429).json({
          error: "Discord is rate limiting requests. Try again in a moment.",
          code: "DISCORD_RATE_LIMITED",
        });
        return;
      }
      logger.error({ err: error }, "GET /api/me failed:");
      res.status(502).json({
        error: "Couldn't load your servers.",
        code: "DISCORD_GUILDS_FAILED",
      });
    }
  });

  return router;
}

export async function readSessionFromRequest(
  req: Request,
): Promise<Awaited<ReturnType<typeof getSession>>> {
  const sid = sessionIdFrom(req);
  if (!sid) return null;
  return await getSession(sid);
}

export function redirectToLogin(req: Request, res: Response): void {
  const url = req.originalUrl ?? req.path;
  if (url.startsWith("/api")) {
    res.status(401).json({ error: "No autenticado.", code: "UNAUTHENTICATED" });
    return;
  }
  res.redirect("/");
}
