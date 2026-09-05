import type { AdobosModule } from "#core/modules/types.js";
import { isWorkerLeader } from "#core/runtime/index.js";
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
    // BILL-01: reconciliación de eventos `pending`/`failed` (crash o error
    // transitorio). Solo el líder — evita reprocesos duplicados con N réplicas.
    if (!isWorkerLeader()) return;
    startWebhookReconciliationSweeper();
  },
};
