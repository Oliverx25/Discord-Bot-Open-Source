import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Express,
  type Request,
  type RequestHandler,
} from "express";
import helmet from "helmet";
import { resolvePublicUploadPath } from "#lib/dataPaths.js";
import { authRouter, meRouter } from "../auth/oauth.js";
import type { BotGateway } from "../discord/botGateway.js";
import { entitlementsRoutes, requireFeature } from "../entitlements/index.js";
import { env } from "../env.js";
import { logger } from "../log.js";
import { httpMetricsMiddleware } from "../metrics/http.js";
import { metricsRouter } from "../metrics/route.js";
import type { ModuleRegistry } from "../modules/registry.js";
import { errorHandler, notFoundHandler } from "./errorHandler.js";
import { requireAuth, requireGuildAccess } from "./guildContext.js";
import { healthRouter } from "./health.js";
import {
  apiRateLimiter,
  authRateLimiter,
  guildRateLimiter,
  uploadRateLimiter,
} from "./rateLimit.js";
import { requestIdMiddleware } from "./requestContext.js";
import { uploadRoutes } from "./uploads.js";

export interface CreateAppOptions {
  botGateway: BotGateway;
  registry: ModuleRegistry;
  staticDir: string;
}

/** Misma allowlist para CORS y para el check de Origin en mutaciones (CSRF). */
export function allowedOrigins(): string[] {
  const raw = env().CORS_ORIGIN?.trim();
  if (raw) {
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return [env().PUBLIC_APP_URL.replace(/\/$/, "") || "http://localhost:4321"];
}

function corsOrigin(): string | string[] {
  const list = allowedOrigins();
  return list.length === 1 ? list[0]! : list;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * AUTH-01: defensa en profundidad además de `sameSite=lax` (que ya bloquea
 * POST/PUT/PATCH/DELETE cross-site) y CORS (que ya bloquea leer la
 * respuesta) — un `Origin` presente y fuera de la allowlist en una mutación
 * se rechaza directo, sin llegar a tocar sesión ni guild.
 */
export function requireTrustedOrigin(): RequestHandler {
  return (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) {
      next();
      return;
    }
    const origin = req.headers.origin;
    if (!origin) {
      // Sin header Origin (curl, clientes nativos, algunos same-origin
      // legacy) — `sameSite=lax` sigue siendo la defensa principal para estos.
      next();
      return;
    }
    if (!allowedOrigins().includes(origin)) {
      res.status(403).json({
        error: "Cross-origin request blocked.",
        code: "CSRF_ORIGIN_MISMATCH",
      });
      return;
    }
    next();
  };
}

function isPublicApiPath(req: Request, registry: ModuleRegistry): boolean {
  if (req.path === "/health" || req.path.startsWith("/health/")) return true;
  const full = `/api${req.path}`;
  return registry.rawRoutes.some((r) => r.path === full || r.path === req.path);
}

/**
 * CSP del panel (Astro estático + islas React + Tailwind + Radix UI).
 * - `script-src 'self'`: Astro sirve todos los bundles desde el mismo origen.
 * - `style-src 'unsafe-inline'`: Tailwind compilado + estilos inline de Radix/React.
 * - `img-src`: avatares e íconos de Discord + subidas propias + data URIs.
 * - `connect-src 'self'`: el panel solo llama a /api del mismo origen.
 * Rollout: arranca con `CSP_REPORT_ONLY=1` para ver violaciones sin romper el
 * panel; quita la variable para hacerla obligatoria.
 */
function helmetMiddleware(): RequestHandler {
  const isProd = env().NODE_ENV === "production";
  const reportOnly =
    env().CSP_REPORT_ONLY === "1" || env().CSP_REPORT_ONLY === "true";

  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      reportOnly,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": [
          "'self'",
          "data:",
          "https://cdn.discordapp.com",
          "https://media.discordapp.net",
        ],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        ...(isProd ? { "upgrade-insecure-requests": [] } : {}),
      },
    },
  });
}

/**
 * Express kernel: health + auth + uploads + rutas de módulos.
 * /api/* (salvo health y webhooks raw) exige sesión. Rutas de dominio exigen guild.
 */
export function createApp(options: CreateAppOptions): Express {
  const app = express();
  const { registry } = options;

  app.set("trust proxy", 1);
  app.use(requestIdMiddleware());
  app.use(helmetMiddleware());
  app.use(cors({ origin: corsOrigin(), credentials: true }));
  app.use(cookieParser());
  app.use(requireTrustedOrigin());
  app.use(httpMetricsMiddleware());
  app.use((req, res, next) => {
    if (req.path === "/api/health" || req.path.startsWith("/api/health/")) {
      next();
      return;
    }
    const start = Date.now();
    res.on("finish", () => {
      logger.info(
        {
          method: req.method,
          // Fase 4 (SEC-01..04, logging seguro): nunca `req.originalUrl` —
          // arrastra el query string completo (p. ej. `code`/`state` de OAuth).
          path: req.path,
          status: res.statusCode,
          ms: Date.now() - start,
          guildId: req.guild?.guildId,
        },
        "http",
      );
    });
    next();
  });

  for (const raw of registry.rawRoutes) {
    app[raw.method](
      raw.path,
      express.raw({ type: "application/json" }),
      raw.handler,
    );
  }
  app.use(express.json({ limit: "1mb" }));

  app.use("/auth", authRateLimiter(), authRouter(options.botGateway));
  app.use("/api/health", healthRouter(options.botGateway));
  app.use("/metrics", metricsRouter());

  app.use("/api", apiRateLimiter(), (req, res, next) => {
    if (isPublicApiPath(req, registry)) return next();
    return requireAuth()(req, res, next);
  });
  app.use("/api/me", meRouter(options.botGateway));
  app.use(
    "/api/entitlements",
    requireGuildAccess(),
    guildRateLimiter(),
    entitlementsRoutes(),
  );
  app.use(
    "/api/uploads",
    uploadRateLimiter(),
    requireGuildAccess(),
    guildRateLimiter(),
    uploadRoutes(),
  );

  for (const entry of registry.routes) {
    // AUTH-01: `guildRateLimiter()` va DESPUÉS de `requireGuildAccess()` —
    // usa `req.guild.{userId,guildId}` ya autorizados, no un query param.
    const guards: RequestHandler[] = [requireGuildAccess(), guildRateLimiter()];
    if (entry.feature) guards.push(requireFeature(entry.feature));
    app.use(entry.basePath, ...guards, entry.router);
  }

  // TEN-01: antes era `express.static` detrás de solo `requireAuth()` — daba
  // igual de qué guild fuera el upload, cualquier sesión válida lo leía. Los
  // uploads viven en `uploads/<kind>/<guildId>/<archivo>` desde la Fase 6;
  // `requireGuildAccess()` valida el `:guildId` de la propia URL.
  app.use(
    "/uploads/:kind/:guildId/:filename",
    requireGuildAccess(),
    (req, res) => {
      const { kind, guildId, filename } = req.params;
      const absolute = resolvePublicUploadPath(
        `/uploads/${kind}/${guildId}/${filename}`,
      );
      if (!absolute) {
        res.status(404).end();
        return;
      }
      res.sendFile(absolute, (err) => {
        if (err) res.status(404).end();
      });
    },
  );

  const serveStatic = env().SERVE_STATIC;
  if (serveStatic) {
    app.use((req, res, next) => {
      if (!req.path.startsWith("/dashboard")) return next();
      return requireAuth()(req, res, next);
    });

    app.use(express.static(options.staticDir));
    // Fallback SPA. Express 5 (path-to-regexp v8) exige el comodín nombrado:
    // "*" a secas ya no es una ruta válida.
    app.get("/*splat", (req, res, next) => {
      if (
        req.path.startsWith("/api") ||
        req.path.startsWith("/uploads") ||
        req.path.startsWith("/auth")
      ) {
        return next();
      }
      res.sendFile(path.join(options.staticDir, "index.html"), (err) => {
        if (err) next();
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

/** App mínima para gateway/worker: solo probes. */
export function createHealthApp(botGateway: BotGateway): Express {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware());
  app.use(helmet()); // solo JSON de health: la CSP por defecto de helmet basta
  app.use("/api/health", healthRouter(botGateway));
  app.use("/metrics", metricsRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
