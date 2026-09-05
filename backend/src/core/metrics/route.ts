/**
 * `/metrics` — scrape Prometheus. No queda expuesto a Internet por
 * construcción: ni nginx (`docker/nginx.conf`) ni ningún Compose publican el
 * puerto de `api`/`gateway`/`worker` al host, y ninguna `location` de nginx
 * proxya rutas fuera de `/api`, `/auth`, `/uploads` — solo es alcanzable
 * desde otro contenedor en la misma red `adobos` (donde también viviría un
 * scraper Prometheus).
 *
 * Defensa en profundidad además de eso (mismo criterio que
 * `requireTrustedOrigin` en createApp.ts): si `METRICS_TOKEN` está seteado,
 * lo exige por header. Sin él, queda abierto dentro de la red interna —
 * aceptable en dev y mientras no haya nada más compartiendo esa red.
 */

import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { env } from "#core/env.js";
import { metricsRegistry } from "./registry.js";

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function metricsRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const expected = env().METRICS_TOKEN?.trim();
    if (expected) {
      const header = req.headers["x-metrics-token"];
      const provided = Array.isArray(header) ? header[0] : header;
      if (!provided || !tokenMatches(provided, expected)) {
        res.status(401).end();
        return;
      }
    }
    res.set("Content-Type", metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });

  return router;
}
