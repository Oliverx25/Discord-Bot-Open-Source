/**
 * Latencia HTTP (Fase 8, PLAN_FINAL_2026.md, §14). Label `route` usa
 * `req.route.path` (el patrón que matcheó, p. ej. `/:kind/:guildId/:filename`)
 * más `req.baseUrl` (el prefijo de montaje) — nunca `req.path`/`req.originalUrl`
 * crudos, que traerían IDs reales y explotarían la cardinalidad de la métrica
 * (mismo criterio que el logging de requests, más abajo en este archivo:
 * "nunca req.originalUrl — arrastra el query string completo").
 */

import { Histogram } from "@prometheus-io/client";
import type { RequestHandler } from "express";
import { metricsRegistry } from "./registry.js";

const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duración de requests HTTP, en segundos.",
  labelNames: ["method", "route", "status"],
  registers: [metricsRegistry],
});

export function httpMetricsMiddleware(): RequestHandler {
  return (req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
      const route = req.route?.path
        ? `${req.baseUrl}${req.route.path}`
        : "unmatched";
      end({ method: req.method, route, status: String(res.statusCode) });
    });
    next();
  };
}
