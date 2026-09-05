import { and, eq, lt, or } from "drizzle-orm";
import type Stripe from "stripe";
import { registerJob } from "#core/lifecycle.js";
import { logger } from "#core/log.js";
import { getDb, one } from "#db/client.js";
import { webhookEvents } from "#db/schema.js";
import {
  applyCheckoutSession,
  applyInvoiceEvent,
  applyStripeSubscription,
} from "./domain/billing.js";
import { stripeObjectId } from "./map.js";
import { getStripe } from "./stripe.js";

/**
 * BILL-01 (PLAN_FINAL_2026.md): el webhook de Stripe hacía
 * `SELECT ¿ya procesado? -> procesar -> INSERT marca procesado`. Dos entregas
 * concurrentes del mismo evento (Stripe garantiza at-least-once, no exactly-once
 * — <https://docs.stripe.com/webhooks>) pasaban el SELECT a la vez y ambas
 * ejecutaban el efecto. Este módulo mueve el `INSERT` al frente como claim
 * atómico (`ON CONFLICT DO NOTHING`) y separa claim/proceso/reconciliación.
 */

const MAX_ATTEMPTS = 5;
const STALE_PENDING_MS = 5 * 60 * 1000;
const SWEEP_MS = 2 * 60 * 1000;

export type WebhookClaim =
  | { kind: "claimed" }
  | { kind: "duplicate" }
  | { kind: "in_flight" }
  | { kind: "dead_letter" };

/** Único punto que decide qué tipo de evento hace qué — reusado por el webhook en vivo y la reconciliación. */
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await applyCheckoutSession(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applyStripeSubscription(event.data.object);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await applyInvoiceEvent(event.data.object);
      break;
    default:
      break;
  }
}

/**
 * Claim atómico. `ON CONFLICT DO NOTHING` decide quién procesa cuando dos
 * entregas llegan a la vez — la que pierde la carrera nunca ejecuta
 * `processStripeEvent`. Los reintentos de un `failed` también son atómicos
 * (`UPDATE ... WHERE status = 'failed'`), así dos reconciliaciones
 * concurrentes no reprocesan el mismo evento dos veces.
 */
export async function claimWebhookEvent(
  eventId: string,
  eventType: string,
  objectId: string | null,
): Promise<WebhookClaim> {
  const inserted = await one(
    getDb()
      .insert(webhookEvents)
      .values({ eventId, eventType, objectId, status: "pending", attempts: 1 })
      .onConflictDoNothing()
      .returning({ eventId: webhookEvents.eventId }),
  );
  if (inserted) return { kind: "claimed" };

  const existing = await one(
    getDb()
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId))
      .limit(1),
  );
  if (!existing) return { kind: "claimed" }; // fila borrada entre el insert y el select — trátalo como nuevo
  if (existing.status === "processed") return { kind: "duplicate" };

  if (existing.status === "failed") {
    if (existing.attempts >= MAX_ATTEMPTS) return { kind: "dead_letter" };
    const reclaimed = await one(
      getDb()
        .update(webhookEvents)
        .set({
          status: "pending",
          attempts: existing.attempts + 1,
          lastError: null,
        })
        .where(
          and(
            eq(webhookEvents.eventId, eventId),
            eq(webhookEvents.status, "failed"),
          ),
        )
        .returning({ eventId: webhookEvents.eventId }),
    );
    return reclaimed ? { kind: "claimed" } : { kind: "in_flight" };
  }

  // status === "pending": otra entrega ya lo tiene (en curso o colgado tras un
  // crash). No se reprocesa inline — la reconciliación se encarga si envejece.
  return { kind: "in_flight" };
}

export async function finalizeWebhookEvent(
  eventId: string,
  outcome: { ok: true } | { ok: false; error: string },
): Promise<void> {
  if (outcome.ok) {
    await getDb()
      .update(webhookEvents)
      .set({ status: "processed", processedAt: new Date(), lastError: null })
      .where(eq(webhookEvents.eventId, eventId));
    return;
  }
  await getDb()
    .update(webhookEvents)
    .set({ status: "failed", lastError: outcome.error.slice(0, 2000) })
    .where(eq(webhookEvents.eventId, eventId));
}

/** Procesa un evento ya reclamado y persiste el resultado. Nunca lanza. */
export async function processAndFinalize(event: Stripe.Event): Promise<void> {
  try {
    await processStripeEvent(event);
    await finalizeWebhookEvent(event.id, { ok: true });
    logger.info(
      { eventId: event.id, type: event.type },
      "webhook stripe: processed",
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await finalizeWebhookEvent(event.id, { ok: false, error: message });
    logger.error(
      { eventId: event.id, type: event.type, err: error },
      "webhook stripe: processing failed",
    );
  }
}

export function objectIdOfEvent(event: Stripe.Event): string | null {
  return stripeObjectId(event.data.object);
}

/**
 * Reconciliación (BILL-01): recupera el objeto vigente por ID desde la API de
 * Stripe (no del payload guardado — no guardamos el payload completo) para
 * los eventos que se quedaron en `pending` más de `STALE_PENDING_MS` (crash
 * entre claim y processed) o en `failed` con reintentos restantes.
 */
export async function reconcileStaleWebhookEvents(): Promise<{
  retried: number;
  deadLettered: number;
}> {
  const stripe = getStripe();
  if (!stripe) return { retried: 0, deadLettered: 0 };

  const cutoff = new Date(Date.now() - STALE_PENDING_MS);
  const stale = await getDb()
    .select()
    .from(webhookEvents)
    .where(
      or(
        and(
          eq(webhookEvents.status, "pending"),
          lt(webhookEvents.receivedAt, cutoff),
        ),
        eq(webhookEvents.status, "failed"),
      ),
    );

  let retried = 0;
  let deadLettered = 0;

  for (const row of stale) {
    if (row.attempts >= MAX_ATTEMPTS) {
      await getDb()
        .update(webhookEvents)
        .set({
          status: "failed",
          lastError: "max attempts reached (reconciler)",
        })
        .where(eq(webhookEvents.eventId, row.eventId));
      deadLettered++;
      logger.error(
        { eventId: row.eventId, type: row.eventType, attempts: row.attempts },
        "webhook stripe: dead-lettered by reconciler",
      );
      continue;
    }

    // Re-claim atómico contra el status con el que lo leímos — si otra
    // réplica ya lo tomó entre el SELECT y aquí, este UPDATE no afecta filas.
    const reclaimed = await one(
      getDb()
        .update(webhookEvents)
        .set({ status: "pending", attempts: row.attempts + 1 })
        .where(
          and(
            eq(webhookEvents.eventId, row.eventId),
            eq(webhookEvents.status, row.status),
          ),
        )
        .returning({ eventId: webhookEvents.eventId }),
    );
    if (!reclaimed) continue;

    try {
      const event = await stripe.events.retrieve(row.eventId);
      await processStripeEvent(event as unknown as Stripe.Event);
      await finalizeWebhookEvent(row.eventId, { ok: true });
      retried++;
    } catch (error: unknown) {
      await finalizeWebhookEvent(row.eventId, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { retried, deadLettered };
}

let sweepTimer: ReturnType<typeof setInterval> | null = null;

/**
 * El caller (`billing/module.ts`, `registerJobs`) ya filtra por
 * `isWorkerLeader()` antes de llamar esto — mismo patrón que
 * `economy/shopExpiration.ts` — para no reprocesar duplicado con N réplicas.
 */
export function startWebhookReconciliationSweeper(): void {
  if (sweepTimer) return;
  void reconcileStaleWebhookEvents();
  sweepTimer = setInterval(() => {
    void reconcileStaleWebhookEvents();
  }, SWEEP_MS);
  registerJob("billing:webhook-reconciliation", sweepTimer);
}
