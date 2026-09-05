/**
 * Alertas operativas (Fase 8, PLAN_FINAL_2026.md, §14): "webhook inbox
 * atrasado, compras pending antiguas y worker sin liderazgo". Sin
 * Alertmanager desplegado — el mecanismo de alerta de este proyecto hoy es
 * `logger.error(...)` (mismo criterio que ya usa `purchaseService.ts` para
 * "needs manual reconciliation"). Además se exponen como Gauges de
 * Prometheus para que un Alertmanager futuro pueda definir reglas sobre
 * ellas sin cambiar este código.
 *
 * Solo arranca en el rol `worker` (ver index.ts). El chequeo de liderazgo
 * corre en TODAS las réplicas worker sin gate — es justo el que tiene que
 * seguir funcionando cuando nadie es líder. Los otros dos se gatean con
 * `isWorkerLeader()` para no repetir la misma alerta N veces en un
 * deployment con N réplicas del rol `worker`.
 */

import { Gauge } from "@prometheus-io/client";
import { and, count, eq, inArray, lt, ne } from "drizzle-orm";
import { isWorkerLeader } from "#core/runtime/index.js";
import { getDb } from "#db/client.js";
import { webhookEvents } from "#db/schema/billing.js";
import { economyPurchases } from "#db/schema/economy.js";
import { workerLeases } from "#db/schema/runtime.js";
import { logger } from "../log.js";
import { metricsRegistry } from "../metrics/registry.js";

const CHECK_INTERVAL_MS = 5 * 60_000;
const WEBHOOK_BACKLOG_MINUTES = 10;
const PENDING_PURCHASE_MINUTES = 30;
/** Gracia tras vencer el lease antes de alertar — evita falso positivo en el instante justo del handoff entre líderes. */
const LEADERSHIP_GRACE_MINUTES = 1;

const webhookInboxBacklog = new Gauge({
  name: "ops_webhook_inbox_backlog",
  help: `Eventos de Stripe sin procesar hace más de ${WEBHOOK_BACKLOG_MINUTES} minutos.`,
  registers: [metricsRegistry],
});

const pendingPurchasesBacklog = new Gauge({
  name: "ops_pending_purchases_backlog",
  help: `Compras de economy en pending/needs_reconciliation hace más de ${PENDING_PURCHASE_MINUTES} minutos.`,
  registers: [metricsRegistry],
});

const workerLeadershipMissing = new Gauge({
  name: "ops_worker_leadership_missing",
  help: "1 si ningún worker tiene el lease de liderazgo vigente, 0 si sí.",
  registers: [metricsRegistry],
});

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

async function checkWebhookInbox(): Promise<void> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(webhookEvents)
    .where(
      and(
        ne(webhookEvents.status, "processed"),
        lt(webhookEvents.receivedAt, minutesAgo(WEBHOOK_BACKLOG_MINUTES)),
      ),
    );
  const n = row?.n ?? 0;
  webhookInboxBacklog.set(n);
  if (n > 0) {
    logger.error(
      { count: n, thresholdMinutes: WEBHOOK_BACKLOG_MINUTES },
      "alert: webhook inbox atrasado (Stripe)",
    );
  }
}

async function checkPendingPurchases(): Promise<void> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(economyPurchases)
    .where(
      and(
        inArray(economyPurchases.status, ["pending", "needs_reconciliation"]),
        lt(economyPurchases.createdAt, minutesAgo(PENDING_PURCHASE_MINUTES)),
      ),
    );
  const n = row?.n ?? 0;
  pendingPurchasesBacklog.set(n);
  if (n > 0) {
    logger.error(
      { count: n, thresholdMinutes: PENDING_PURCHASE_MINUTES },
      "alert: compras de economy pending/needs_reconciliation atrasadas",
    );
  }
}

async function checkWorkerLeadership(): Promise<void> {
  const [row] = await getDb()
    .select({ expiresAt: workerLeases.expiresAt })
    .from(workerLeases)
    .where(eq(workerLeases.name, "worker"));
  // Sin fila = nunca se adquirió (arranque en frío) — también es "sin líder".
  const missing = !row || row.expiresAt < minutesAgo(LEADERSHIP_GRACE_MINUTES);
  workerLeadershipMissing.set(missing ? 1 : 0);
  if (missing) {
    logger.error(
      "alert: ningún worker tiene el lease de liderazgo vigente — crons (giveaways/reminders/scheduled-messages/auto-delete/action-logs/stream-alerts) no están corriendo",
    );
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

/** Idempotente. Solo se llama desde el rol `worker` (ver index.ts). */
export function startOpsAlertsJob(): void {
  if (timer) return;
  const tick = () => {
    void checkWorkerLeadership().catch((err: unknown) =>
      logger.warn({ err }, "alert: chequeo de liderazgo falló"),
    );
    if (!isWorkerLeader()) return;
    void checkWebhookInbox().catch((err: unknown) =>
      logger.warn({ err }, "alert: chequeo de webhook inbox falló"),
    );
    void checkPendingPurchases().catch((err: unknown) =>
      logger.warn({ err }, "alert: chequeo de compras pending falló"),
    );
  };
  timer = setInterval(tick, CHECK_INTERVAL_MS);
  timer.unref();
  tick();
}

export function stopOpsAlertsJob(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
