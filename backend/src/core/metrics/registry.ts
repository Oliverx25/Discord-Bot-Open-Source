/**
 * Registro compartido de métricas Prometheus (Fase 8, PLAN_FINAL_2026.md,
 * §14: "métricas por rol"). `collectDefaultMetrics` ya cubre, gratis, CPU,
 * memoria, GC y event-loop lag (`nodejs_eventloop_lag_seconds*`) — el resto
 * de este directorio agrega las métricas específicas del dominio (HTTP,
 * Discord, cola, pool de DB) sobre este mismo registro.
 *
 * `@prometheus-io/client`, no `prom-client`: mismo autor/API, pero
 * `prom-client` está deprecado a favor de este paquete, mantenido por el
 * propio proyecto Prometheus (github.com/prometheus/client_js).
 */

import { collectDefaultMetrics, Registry } from "@prometheus-io/client";
import { runtimeRole } from "#core/runtime/index.js";

export const metricsRegistry = new Registry();

let installed = false;

/** Idempotente: los tres roles llaman esto una vez al boot (ver index.ts). */
export function installDefaultMetrics(): void {
  if (installed) return;
  installed = true;
  metricsRegistry.setDefaultLabels({ role: runtimeRole() });
  collectDefaultMetrics({ register: metricsRegistry });
}
