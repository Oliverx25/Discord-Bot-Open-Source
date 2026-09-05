import "zod/compile";
import path from "node:path";
import {
  startSessionPruneJob,
  stopSessionPruneJob,
} from "#core/auth/sessionStore.js";
import { initRedis } from "#core/cache/redis.js";
import { RedisStore } from "#core/cache/redisStore.js";
import { setCacheStore } from "#core/cache/store.js";
import { installCacheWarmer } from "#core/discord/cacheWarmer.js";
import { createBotClient } from "#core/discord/createClient.js";
import { LocalClientGateway } from "#core/discord/localClientGateway.js";
import { RestGateway } from "#core/discord/restGateway.js";
import { loadEnv } from "#core/env.js";
import { createApp, createHealthApp } from "#core/http/createApp.js";
import {
  installProcessGuards,
  onShutdown,
  runShutdown,
} from "#core/lifecycle.js";
import { logger } from "#core/log.js";
import { installDbPoolMetrics } from "#core/metrics/dbPool.js";
import { installDiscordMetrics } from "#core/metrics/discord.js";
import { installQueueDepthMetrics } from "#core/metrics/queueDepth.js";
import { installDefaultMetrics } from "#core/metrics/registry.js";
import { loadModules } from "#core/modules/index.js";
import {
  roleRunsGateway,
  roleRunsHttp,
  roleRunsWorker,
  setRuntimeRole,
} from "#core/runtime/index.js";
import {
  startWorkerLeadershipLease,
  stopWorkerLeadershipLease,
} from "#core/runtime/workerLease.js";
import { closeDatabase, connectDatabase } from "#db/client.js";
import { startOrphanedUploadsSweeper } from "#lib/uploadedAssets.js";
import { wireCustomCommandsBuiltinSync } from "#modules/custom-commands/module.js";
import { ENABLED_MODULES } from "#modules/index.js";

const __dirname = import.meta.dirname;

async function main(): Promise<void> {
  installProcessGuards();

  const cfg = loadEnv();
  setRuntimeRole(cfg.ADOBO_ROLE);
  installDefaultMetrics();

  // Redis es obligatorio en los tres roles (cache/rate-limit/queue compartidos).
  if (cfg.REDIS_URL) {
    const { client, subscriber } = initRedis(cfg.REDIS_URL);
    setCacheStore(new RedisStore(client, subscriber));
    logger.info("cache: RedisStore (L1 + L2 + pub/sub) activo");
  }

  // OPS-01: nunca migra acá — el one-shot `migrate` de Compose ya corrió
  // antes de que este proceso arranque (ver docker-compose*.yml).
  await connectDatabase();
  installDbPoolMetrics();
  installQueueDepthMetrics();
  onShutdown("db", () => closeDatabase());

  if (roleRunsWorker(cfg.ADOBO_ROLE)) {
    await startWorkerLeadershipLease();
    onShutdown("worker-lease", () => stopWorkerLeadershipLease());
    // TEN-01: huérfanos son inequívocos por diseño (archivo sin fila en DB
    // tras la gracia) — no hace falta liderazgo para borrarlos.
    startOrphanedUploadsSweeper();
  }

  if (roleRunsHttp(cfg.ADOBO_ROLE)) {
    startSessionPruneJob();
    onShutdown("session-prune", () => stopSessionPruneJob());
  }

  const registry = loadModules(ENABLED_MODULES);
  wireCustomCommandsBuiltinSync();

  // Qué fases de módulo corre este rol.
  const phases = {
    http: roleRunsHttp(cfg.ADOBO_ROLE),
    // Solo `gateway` atiende eventos/interacciones de Discord.
    gateway: roleRunsGateway(cfg.ADOBO_ROLE),
    jobs: roleRunsWorker(cfg.ADOBO_ROLE),
  };

  // Solo `gateway` sostiene un Client vivo. `api` y `worker` hablan
  // con Discord por REST (`RestGateway`).
  const bot = roleRunsGateway(cfg.ADOBO_ROLE)
    ? createBotClient(registry)
    : null;
  if (bot) onShutdown("discord", () => bot.destroy());

  const botGateway = bot ? new LocalClientGateway(bot) : new RestGateway();

  registry.collect(bot, botGateway, phases);
  registry.attach();

  const app = roleRunsHttp(cfg.ADOBO_ROLE)
    ? createApp({
        botGateway,
        registry,
        staticDir: cfg.STATIC_DIR ?? path.resolve(__dirname, "../public"),
      })
    : createHealthApp(botGateway);

  if (bot) {
    installDiscordMetrics(bot);
    // Warmer: reescribe la caché read-through de Redis por evento (solo si hay
    // un `api` que la lea, i.e. Redis activo).
    if (cfg.REDIS_URL) installCacheWarmer(bot, botGateway);
    if (cfg.DISCORD_TOKEN) {
      await bot.login(cfg.DISCORD_TOKEN);
    } else {
      logger.warn(
        "DISCORD_TOKEN not defined — the process starts without the Discord gateway.",
      );
    }
  } else {
    logger.info(
      `ADOBO_ROLE=${cfg.ADOBO_ROLE} — sin Client de Discord (REST only)`,
    );
  }

  const httpServer = app.listen(cfg.PORT, cfg.HOST, () => {
    const kind = roleRunsHttp(cfg.ADOBO_ROLE)
      ? cfg.SERVE_STATIC
        ? "Panel + API"
        : "API"
      : "health";
    logger.info(
      `${kind} (${cfg.ADOBO_ROLE}) en http://${cfg.HOST}:${cfg.PORT}`,
    );
  });

  // `close()` deja de aceptar conexiones nuevas y espera a las abiertas.
  // Sin timer que compita: el timeout por-hook del lifecycle es la red de seguridad.
  onShutdown(
    "http",
    () =>
      new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      }),
  );
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "Fallo al iniciar:");
  void runShutdown("startup-failure", 1);
});
