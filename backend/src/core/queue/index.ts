/**
 * Abstracción de cola de trabajo.
 *
 * - Con `REDIS_URL`: BullMQ. El productor (líder) hace `add()`; N procesos del
 *   rol `worker` consumen con `process()`.
 * - Sin `REDIS_URL`: modo inline — `add()` ejecuta el handler en el acto
 *   (mismo comportamiento que el bucle de polling de hoy, un solo proceso).
 *
 * El código de módulo solo ve `defineQueue<T>(name)` y no sabe cuál está activo.
 */

import { Queue, Worker } from "bullmq";
import { redisUrl } from "#core/cache/redis.js";
import { onShutdown } from "#core/lifecycle.js";
import { logger } from "#core/log.js";
import {
  queueJobFailures,
  queueJobStalled,
} from "#core/metrics/queueCounters.js";
import { roleRunsWorker } from "#core/runtime/index.js";
import { newBullConnection } from "./connection.js";

export interface QueueHandle<T> {
  /** Encola (BullMQ) o ejecuta el handler ahora mismo (inline). */
  add(data: T, opts?: { jobId?: string }): Promise<void>;
  /** Registra el procesador. En BullMQ solo arranca Worker si el rol es `worker`. */
  process(handler: (data: T) => Promise<void>): void;
}

/** OPS-02: nombres de cola con un `Worker` BullMQ vivo — lo consulta el readiness del rol `worker`. */
const activeWorkers = new Set<string>();

export function activeQueueWorkerNames(): string[] {
  return [...activeWorkers];
}

/** Fase 8 (métricas): `Queue` vivas para muestrear profundidad (`queueDepth.ts`). */
const queueInstances = new Map<string, Queue>();

export function queueRegistrySnapshot(): ReadonlyMap<string, Queue> {
  return queueInstances;
}

const WORKER_CONCURRENCY = 4;
const DEFAULT_JOB_OPTS = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: 1_000,
  removeOnFail: 5_000,
};

export function defineQueue<T>(name: string): QueueHandle<T> {
  const useRedis = Boolean(redisUrl());
  let handler: ((data: T) => Promise<void>) | null = null;
  let queue: Queue | null = null;
  let worker: Worker | null = null;

  function ensureQueue(): Queue | null {
    if (queue) return queue;
    const connection = newBullConnection();
    if (!connection) return null;
    queue = new Queue(name, { connection });
    queueInstances.set(name, queue);
    onShutdown(`queue:${name}`, () => {
      queueInstances.delete(name);
      return queue?.close();
    });
    return queue;
  }

  return {
    async add(data, opts) {
      if (useRedis) {
        const q = ensureQueue();
        if (q) {
          await q.add(name, data, { ...DEFAULT_JOB_OPTS, jobId: opts?.jobId });
          return;
        }
        logger.warn(
          { queue: name },
          "queue: sin conexión Redis, ejecuto inline",
        );
      }
      if (!handler) {
        logger.error({ queue: name }, "queue.add sin handler registrado");
        return;
      }
      try {
        await handler(data);
      } catch (err) {
        logger.warn({ err, queue: name }, "queue: job inline falló");
      }
    },

    process(fn) {
      handler = fn;
      if (!useRedis || worker || !roleRunsWorker()) return;
      const connection = newBullConnection();
      if (!connection) return;
      // Fase 8 (métricas): mantiene un `Queue` vivo también en el rol
      // `worker` — sin esto, un worker puro (que nunca llama `.add()`) nunca
      // tendría de dónde muestrear su propia profundidad de cola.
      ensureQueue();
      worker = new Worker(
        name,
        async (job) => {
          await fn(job.data as T);
        },
        { connection, concurrency: WORKER_CONCURRENCY },
      );
      worker.on("failed", (job, err) => {
        const attempts = job?.attemptsMade ?? 0;
        const maxAttempts = job?.opts?.attempts ?? 1;
        queueJobFailures.inc({
          queue: name,
          final: String(attempts >= maxAttempts),
        });
        logger.warn(
          { err, queue: name, jobId: job?.id, attempts },
          "queue: job falló",
        );
      });
      worker.on("stalled", (jobId) => {
        queueJobStalled.inc({ queue: name });
        logger.warn({ queue: name, jobId }, "queue: job stalled");
      });
      activeWorkers.add(name);
      onShutdown(`worker:${name}`, () => {
        activeWorkers.delete(name);
        return worker?.close();
      });
      logger.info({ queue: name }, "queue: worker BullMQ activo");
    },
  };
}
