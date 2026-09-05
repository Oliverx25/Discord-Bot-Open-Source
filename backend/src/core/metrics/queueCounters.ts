/**
 * Contadores de cola (Fase 8, PLAN_FINAL_2026.md, §14: "retries, jobs
 * stalled"). Archivo separado de `queueDepth.ts` a propósito: `core/queue/
 * index.ts` importa estos contadores directo (para incrementarlos desde los
 * listeners de BullMQ que ya tiene), y `queueDepth.ts` importa DE
 * `core/queue/index.ts` (para leer qué colas existen) — este archivo no
 * depende de ninguno de los dos, así que no hay ciclo.
 */

import { Counter } from "@prometheus-io/client";
import { metricsRegistry } from "./registry.js";

export const queueJobFailures = new Counter({
  name: "queue_job_failures_total",
  help: "Intentos de job de BullMQ que fallaron (retry o agotado).",
  labelNames: ["queue", "final"],
  registers: [metricsRegistry],
});

export const queueJobStalled = new Counter({
  name: "queue_job_stalled_total",
  help: "Jobs de BullMQ marcados 'stalled' (el worker no confirmó a tiempo).",
  labelNames: ["queue"],
  registers: [metricsRegistry],
});
