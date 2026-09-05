/**
 * Pool de conexiones Postgres (Fase 8, PLAN_FINAL_2026.md, §14). Muestreado
 * al momento del scrape (`collect`), no por polling — `postgres` (porsager)
 * no expone contadores de pool en su API pública, así que se consulta
 * `pg_stat_activity` (ver `poolStats()` en `#db/client.js`), la fuente de
 * verdad real del lado del servidor.
 */

import { Gauge } from "@prometheus-io/client";
import { poolStats } from "#db/client.js";
import { metricsRegistry } from "./registry.js";

let installed = false;

/** Idempotente — los tres roles llaman esto una vez al boot (ver index.ts). */
export function installDbPoolMetrics(): void {
  if (installed) return;
  installed = true;

  new Gauge({
    name: "db_pool_connections",
    help: "Conexiones Postgres de este proceso, por estado (pg_stat_activity).",
    labelNames: ["state"],
    registers: [metricsRegistry],
    async collect() {
      const stats = await poolStats();
      this.reset();
      for (const { state, count } of stats) {
        this.set({ state }, count);
      }
    },
  });
}
