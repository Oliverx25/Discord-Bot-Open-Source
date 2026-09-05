import type { AdobosModule } from "#core/modules/types.js";
import { billingRoutes } from "./http/routes.js";
import { startWebhookReconciliationSweeper } from "./inbox.js";
import { stripeWebhookHandler } from "./webhook.js";

/** Facturación Stripe. El webhook se registra con rawRoute (body crudo). */
export const billingModule: AdobosModule = {
  id: "billing",
  name: "Billing",
  registerHttp(ctx) {
    ctx.rawRoute("post", "/api/billing/webhook", stripeWebhookHandler);
    ctx.route("/api/billing", billingRoutes());
  },
  registerJobs() {
    // BILL-01/OPS-01: reconciliación de eventos `pending`/`failed`. El
    // sweeper re-chequea `isWorkerLeader()` en cada tick (ver inbox.ts).
    startWebhookReconciliationSweeper();
  },
};
