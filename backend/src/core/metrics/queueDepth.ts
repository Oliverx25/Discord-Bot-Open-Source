/**
 * Profundidad de cola (Fase 8, PLAN_FINAL_2026.md, §14). Muestreada al
 * momento del scrape (`collect`), no por polling — mismo criterio que
 * `dbPool.ts`. Lee `queueRegistrySnapshot()` de `core/queue/index.ts`: la
 * `Queue` de BullMQ que exista en ESTE proceso para cada nombre (`.add()` en
 * productores, o la que `process()` ahora también crea en `worker` — ver
 * comentario ahí). `getJobCounts()` refleja el estado real en Redis
 * (compartido entre todos los procesos), así que da igual desde qué
 * conexión se consulte.
 */

import { Gauge } from "@prometheus-io/client";
import { queueRegistrySnapshot } from "#core/queue/index.js";
import { metricsRegistry } from "./registry.js";

let installed = false;

/** Idempotente — los tres roles llaman esto una vez al boot (ver index.ts). */
export function installQueueDepthMetrics(): void {
  if (installed) return;
  installed = true;

  new Gauge({
    name: "queue_jobs",
    help: "Jobs de BullMQ por cola y estado (waiting/active/delayed/failed/completed).",
    labelNames: ["queue", "state"],
    registers: [metricsRegistry],
    async collect() {
      this.reset();
      for (const [name, queue] of queueRegistrySnapshot()) {
        const counts = await queue.getJobCounts(
          "waiting",
          "active",
          "delayed",
          "failed",
          "completed",
        );
        for (const [state, count] of Object.entries(counts)) {
          this.set({ queue: name, state }, count);
        }
      }
    },
  });
}
