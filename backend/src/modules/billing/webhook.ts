import type { RequestHandler } from "express";
import Stripe from "stripe";
import { HttpError } from "#core/http/httpError.js";
import { logger } from "#core/log.js";
import {
  claimWebhookEvent,
  objectIdOfEvent,
  processAndFinalize,
} from "./inbox.js";
import { requireStripe, requireWebhookSecret } from "./stripe.js";

/**
 * POST /api/billing/webhook — público, body crudo, firma verificada.
 * Express 5 enruta el throw síncrono y la promesa rechazada al errorHandler;
 * el `try/catch` interno se queda porque traduce el error de firma de Stripe.
 *
 * BILL-01: responde 2xx justo después de reclamar el evento (persistido en
 * `webhook_events`), no después de `processStripeEvent` — Stripe recomienda
 * responder rápido y no depende de que el efecto ya haya corrido. Si el
 * proceso muere entre el claim y el resultado, `reconcileStaleWebhookEvents`
 * (inbox.ts) lo recoge más tarde releyendo el evento vigente desde Stripe.
 */
export const stripeWebhookHandler: RequestHandler = async (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    throw new HttpError(
      "The Stripe webhook requires the raw body.",
      500,
      "WEBHOOK_BODY_PARSED",
    );
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    throw new HttpError(
      "Missing the Stripe-Signature header.",
      400,
      "STRIPE_SIGNATURE_MISSING",
    );
  }

  const stripe = requireStripe();
  const secret = requireWebhookSecret();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (error: unknown) {
    if (
      error instanceof Stripe.errors.StripeSignatureVerificationError ||
      (error instanceof Error &&
        error.name === "StripeSignatureVerificationError")
    ) {
      throw new HttpError(
        "Invalid webhook signature.",
        400,
        "STRIPE_SIGNATURE_INVALID",
      );
    }
    throw error;
  }

  const claim = await claimWebhookEvent(
    event.id,
    event.type,
    objectIdOfEvent(event),
  );

  if (claim.kind === "duplicate") {
    res.json({ received: true, duplicate: true });
    return;
  }
  if (claim.kind === "in_flight") {
    // Otra entrega concurrente ya lo tiene, o un intento previo sigue en
    // curso/colgado — nunca se ejecuta el efecto dos veces por esta vía.
    res.json({ received: true, inFlight: true });
    return;
  }
  if (claim.kind === "dead_letter") {
    logger.error(
      { eventId: event.id, type: event.type },
      "webhook stripe: dead-lettered, no more retries",
    );
    res.json({ received: true, deadLettered: true });
    return;
  }

  // claim.kind === "claimed": ganamos la carrera. Responder ya, procesar después.
  res.json({ received: true });
  void processAndFinalize(event);
};
