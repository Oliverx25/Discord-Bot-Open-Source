import type { HealthResponse, ReadyResponse } from "@adobos/shared";
import { Router } from "express";
import { pingRedis } from "#core/cache/redis.js";
import type { BotGateway } from "#core/discord/botGateway.js";
import { activeQueueWorkerNames } from "#core/queue/index.js";
import {
  isWorkerLeader,
  roleRunsGateway,
  roleRunsWorker,
  runtimeRole,
} from "#core/runtime/index.js";
import { pingDatabase } from "#db/client.js";

/**
 * OPS-02 (PLAN_FINAL_2026.md, §12.3): antes `/ready` solo miraba Postgres y
 * (si `gateway`) el Client de Discord — ignoraba Redis (obligatorio en los
 * tres roles desde la Fase 1) y, en `worker`, si los consumidores BullMQ
 * realmente arrancaron. Un `worker` sin Redis pasaba readiness igual.
 */
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
    const role = runtimeRole();
    const [postgres, redis] = await Promise.all([pingDatabase(), pingRedis()]);

    const isGateway = roleRunsGateway(role);
    const discord = isGateway ? gateway.isReady() : "skipped";

    const isWorker = roleRunsWorker(role);
    const queueConsumers = isWorker
      ? activeQueueWorkerNames().length > 0
      : "skipped";
    // Informativo: ser standby es un estado normal y válido, nunca hace
    // fallar el readiness — liveness y "soy el líder ahora mismo" son cosas
    // distintas (ver nota en runtime/workerLease.ts).
    const leader = isWorker ? isWorkerLeader() : "skipped";

    const ok =
      postgres &&
      redis &&
      (discord === "skipped" || discord === true) &&
      (queueConsumers === "skipped" || queueConsumers === true);

    const body: ReadyResponse = {
      status: ok ? "ok" : "degraded",
      role,
      postgres,
      redis,
      discord,
      queueConsumers,
      leader,
      timestamp: new Date().toISOString(),
    };
    res.status(ok ? 200 : 503).json(body);
  });

  return router;
}
