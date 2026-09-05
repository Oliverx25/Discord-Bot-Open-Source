/**
 * Conexión Redis compartida (caché L2 + pub/sub + store de rate-limit).
 * BullMQ (P2.17) abre su propia conexión desde la misma `REDIS_URL`.
 * Obligatoria en los tres roles desde la Fase 1 del plan de consolidación
 * (topología split) — `loadEnv()` ya rechaza el boot sin `REDIS_URL`.
 */

import { Redis } from "ioredis";
import { onShutdown } from "../lifecycle.js";
import { logger } from "../log.js";

let client: Redis | null = null;
let subscriber: Redis | null = null;

export function initRedis(url: string): { client: Redis; subscriber: Redis } {
  if (client && subscriber) return { client, subscriber };

  client = new Redis(url, {
    // Falla rápido: la caché degrada a L1/DB si Redis no responde.
    maxRetriesPerRequest: 2,
    enableOfflineQueue: true,
    connectTimeout: 5_000,
  });
  subscriber = new Redis(url, { maxRetriesPerRequest: null });

  for (const [name, conn] of [
    ["client", client],
    ["subscriber", subscriber],
  ] as const) {
    conn.on("error", (err: unknown) => {
      logger.error({ err, conn: name }, "redis: error de conexión");
    });
    conn.on("ready", () => logger.info({ conn: name }, "redis: listo"));
  }

  onShutdown("redis", async () => {
    await Promise.allSettled([client?.quit(), subscriber?.quit()]);
    client = null;
    subscriber = null;
  });

  return { client, subscriber };
}

export function redisClient(): Redis | null {
  return client;
}

/** OPS-02: readiness — Redis es obligatorio en los tres roles. */
export async function pingRedis(): Promise<boolean> {
  if (!client) return false;
  try {
    return (await client.ping()) === "PONG";
  } catch {
    return false;
  }
}

export function redisSubscriber(): Redis | null {
  return subscriber;
}

/** URL cruda (para que BullMQ abra su propia conexión). */
export function redisUrl(): string | null {
  return process.env.REDIS_URL?.trim() || null;
}
