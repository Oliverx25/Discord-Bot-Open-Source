import type { Request, RequestHandler } from "express";
import rateLimit, { type Store } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { hashSessionId } from "../auth/crypto.js";
import { SESSION_COOKIE_ALIASES } from "../auth/types.js";
import { redisClient } from "../cache/redis.js";

function skipPublic(req: Request): boolean {
  return (
    req.path === "/health" ||
    req.path.startsWith("/health/") ||
    req.path === "/billing/webhook"
  );
}

/**
 * AUTH-01: la clave usaba el session ID crudo — visible tal cual en Redis
 * (`redis-cli KEYS 'rl:api:*'` entregaba cookies de sesión activas). Se
 * hashea igual que en `panel_sessions`. Tampoco usa ya `guildId` de
 * query/params sin validar (ver `guildRateLimiter` más abajo): cualquier
 * sesión de panel podía mandar `?guildId=<guild-víctima>` y llenar el balde
 * de rate limit de un guild que ni administra — un DoS cruzado de tenant vía
 * colisión de clave.
 */
function sessionOrIpKey(req: Request): string {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  let sid = "";
  if (cookies) {
    for (const name of SESSION_COOKIE_ALIASES) {
      const raw = cookies[name];
      if (typeof raw === "string" && raw.length > 0) {
        sid = raw;
        break;
      }
    }
  }
  if (sid) return `s:${hashSessionId(sid)}`;
  return req.ip ?? "unknown";
}

/**
 * Store Redis compartido si hay `REDIS_URL` — así el límite es por tenant
 * en todas las réplicas del rol `api`, no N× por réplica. Sin Redis: memoria.
 */
function store(prefix: string): Store | undefined {
  const client = redisClient();
  if (!client) return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) =>
      client.call(args[0]!, ...args.slice(1)) as Promise<never>,
  });
}

/** Panel autenticado: 120 req/min por sesión (hasheada) o IP. */
export function apiRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipPublic,
    keyGenerator: sessionOrIpKey,
    validate: { keyGeneratorIpFallback: false },
    store: store("rl:api:"),
    message: {
      error: "Too many requests. Try again in a moment.",
      code: "RATE_LIMITED",
    },
  });
}

/** OAuth: 30 intentos / 15 min por IP. */
export function authRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    store: store("rl:auth:"),
    message: {
      error: "Too many login attempts. Wait a few minutes.",
      code: "RATE_LIMITED",
    },
  });
}

/** Subidas: 40 / 15 min por sesión (hasheada) o IP. */
export function uploadRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60_000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: sessionOrIpKey,
    validate: { keyGeneratorIpFallback: false },
    store: store("rl:upload:"),
    message: {
      error: "Too many uploads. Wait a few minutes.",
      code: "RATE_LIMITED",
    },
  });
}

/**
 * AUTH-01: límite adicional por guild — monta DESPUÉS de
 * `requireGuildAccess()`, así `req.guild.{userId,guildId}` ya está
 * autorizado (no un query param sin validar). 300 req/min por usuario+guild:
 * generoso para uso normal del panel, bajo para un cliente descontrolado
 * golpeando un solo guild.
 */
export function guildRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const guild = req.guild;
      return guild
        ? `u:${guild.userId}:g:${guild.guildId}`
        : (req.ip ?? "unknown");
    },
    validate: { keyGeneratorIpFallback: false },
    store: store("rl:guild:"),
    message: {
      error: "Too many requests for this server. Try again in a moment.",
      code: "RATE_LIMITED",
    },
  });
}
