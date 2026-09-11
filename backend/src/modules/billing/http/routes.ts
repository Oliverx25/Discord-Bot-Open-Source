import { Router } from "express";
import { guildIdOf } from "#core/http/guildContext.js";
import { HttpError } from "#core/http/httpError.js";
import { defineRoute } from "#core/http/validate.js";
import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
} from "../domain/billing.js";
import { billingCheckoutSchema } from "./schema.js";

function userIdOf(req: Parameters<typeof guildIdOf>[0]): string {
  const id = req.guild?.userId ?? req.panelSession?.userId;
  if (!id) {
    throw new HttpError("Missing session.", 401, "UNAUTHENTICATED");
  }
  return id;
}

export function billingRoutes(): Router {
  const router = Router();

  router.get(
    "/",
    defineRoute({}, async (req, res) => {
      res.json(
        await getBillingStatus({
          userId: userIdOf(req),
          guildId: guildIdOf(req),
        }),
      );
    }),
  );

  router.post(
    "/checkout",
    defineRoute({ body: billingCheckoutSchema }, async (req, res, valid) => {
      res.json(
        await createCheckoutSession({
          userId: userIdOf(req),
          guildId: guildIdOf(req),
          tier: valid.body.tier,
        }),
      );
    }),
  );

  router.post(
    "/portal",
    defineRoute({}, async (req, res) => {
      res.json(await createPortalSession({ userId: userIdOf(req) }));
    }),
  );

  return router;
}
