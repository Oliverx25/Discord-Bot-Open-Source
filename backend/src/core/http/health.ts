import type { HealthResponse, ReadyResponse } from "@adobos/shared";
import { Router } from "express";
import type { BotGateway } from "#core/discord/botGateway.js";
import { roleRunsGateway } from "#core/runtime/index.js";
import { pingDatabase } from "#db/client.js";

export function healthRouter(gateway: BotGateway): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    const body: HealthResponse = {
      status: "ok",
      uptime: process.uptime(),
      botReady: gateway.isReady(),
      timestamp: new Date().toISOString(),
    };
    res.json(body);
  });

  router.get("/ready", async (_req, res) => {
    const postgres = await pingDatabase();
    const checkDiscord = roleRunsGateway();
    const discord = checkDiscord ? gateway.isReady() : "skipped";
    const ok = postgres && (discord === "skipped" || discord === true);
    const body: ReadyResponse = {
      status: ok ? "ok" : "degraded",
      postgres,
      discord,
      timestamp: new Date().toISOString(),
    };
    res.status(ok ? 200 : 503).json(body);
  });

  return router;
}
