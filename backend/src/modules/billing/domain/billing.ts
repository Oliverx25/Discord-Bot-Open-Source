import {
  guildCoveredByOtherPayer,
  isPaidSubscriptionStatus,
  isPlanTier,
  isSubscriptionStatus,
  type PaidPlanTier,
  type PlanTier,
  type SubscriptionStatus,
} from "@adobos/shared";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import {
  getGuildEntitlementRow,
  getGuildTier,
  listGuildIdsForSubscription,
  setTierForSubscriptionGuilds,
  upsertGuildEntitlement,
} from "#core/entitlements/service.js";
import { HttpError } from "#core/http/httpError.js";
import { logger } from "#core/log.js";
import { getDb, one } from "#db/client.js";
import {
  billingCustomers,
  type SubscriptionRow,
  subscriptions,
} from "#db/schema.js";
import {
  invoiceSubscriptionId,
  isPaidStripeStatus,
  normalizeStripeStatus,
  paidTierOrPro,
  stripeObjectId,
  subscriptionPeriodEndUnix,
  tierFromPriceId,
  unixToDate,
} from "../map.js";
import {
  getStripe,
  priceIdForTier,
  publicAppUrl,
  requireStripe,
  stripePriceEnv,
  pricesConfigured as stripePricesConfigured,
  stripeReady,
} from "../stripe.js";

function metadataString(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key]?.trim();
  return value || null;
}

function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  const price = sub.items.data[0]?.price;
  return stripeObjectId(price);
}

function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  return unixToDate(subscriptionPeriodEndUnix(sub));
}

function cancelAtFromSubscription(sub: Stripe.Subscription): Date | null {
  const unix = sub.cancel_at;
  if (typeof unix === "number") return unixToDate(unix);
  if (sub.cancel_at_period_end) return periodEndFromSubscription(sub);
  return null;
}

export async function getBillingCustomer(
  userId: string,
): Promise<string | null> {
  const row = await one(
    getDb()
      .select({ stripeCustomerId: billingCustomers.stripeCustomerId })
      .from(billingCustomers)
      .where(eq(billingCustomers.userId, userId))
      .limit(1),
  );
  return row?.stripeCustomerId ?? null;
}

export async function getUserIdByCustomer(
  stripeCustomerId: string,
): Promise<string | null> {
  const row = await one(
    getDb()
      .select({ userId: billingCustomers.userId })
      .from(billingCustomers)
      .where(eq(billingCustomers.stripeCustomerId, stripeCustomerId))
      .limit(1),
  );
  return row?.userId ?? null;
}

export async function ensureBillingCustomer(
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  const now = new Date();
  await getDb()
    .insert(billingCustomers)
    .values({
      userId,
      stripeCustomerId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: billingCustomers.userId,
      set: { stripeCustomerId, updatedAt: now },
    });
}

async function stripeCustomerExists(customerId: string): Promise<boolean> {
  const stripe = requireStripe();
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return !("deleted" in customer && customer.deleted);
  } catch (error: unknown) {
    if (error instanceof Error && /No such customer/i.test(error.message)) {
      return false;
    }
    throw error;
  }
}

/** Customer de esta cuenta Stripe. Si el id local es de otra cuenta (test anterior), se recrea. */
export async function getOrCreateStripeCustomer(
  userId: string,
): Promise<string> {
  const stripe = requireStripe();
  const existing = await getBillingCustomer(userId);
  if (existing && (await stripeCustomerExists(existing))) {
    return existing;
  }
  if (existing) {
    logger.warn(
      { userId },
      "Stale Stripe customer (other account or deleted); creating a new one",
    );
  }
  const customer = await stripe.customers.create({
    metadata: { discordUserId: userId },
  });
  await ensureBillingCustomer(userId, customer.id);
  return customer.id;
}

export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<SubscriptionRow | undefined> {
  return one(
    getDb()
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1),
  );
}

export async function getSubscriptionById(
  id: number,
): Promise<SubscriptionRow | undefined> {
  return one(
    getDb()
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1),
  );
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string }).code === "23505";
}

async function coveringSubscriptionForGuild(
  guildId: string,
): Promise<SubscriptionRow | undefined> {
  const entitlement = await getGuildEntitlementRow(guildId);
  if (!entitlement?.subscriptionId) return undefined;
  return getSubscriptionById(entitlement.subscriptionId);
}

async function upsertSubscriptionRow(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  tier: PlanTier;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
}): Promise<SubscriptionRow> {
  const now = new Date();
  const existing = await getSubscriptionByStripeId(input.stripeSubscriptionId);
  if (existing) {
    const [updated] = await getDb()
      .update(subscriptions)
      .set({
        userId: input.userId,
        stripeCustomerId: input.stripeCustomerId,
        stripePriceId: input.stripePriceId,
        tier: input.tier,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelAt: input.cancelAt,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await getDb()
    .insert(subscriptions)
    .values({
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripePriceId: input.stripePriceId,
      tier: input.tier,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAt: input.cancelAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!created) {
    throw new HttpError(
      "Couldn't save the subscription.",
      500,
      "SUBSCRIPTION_INSERT_FAILED",
    );
  }
  return created;
}

/** Bind 1:1 webhook: esta sub Stripe cubre este guild, o no cubre ninguno. */
export async function assignGuildToSubscription(input: {
  guildId: string;
  subscriptionId: number;
  tier: PlanTier;
  userId: string;
}): Promise<void> {
  const existing = await getGuildEntitlementRow(input.guildId);
  if (
    existing?.subscriptionId &&
    existing.subscriptionId !== input.subscriptionId
  ) {
    const other = await getSubscriptionById(existing.subscriptionId);
    if (other && isPaidSubscriptionStatus(other.status)) {
      throw new HttpError(
        "This server is already covered by another subscription.",
        409,
        "GUILD_ALREADY_COVERED",
      );
    }
  }

  const bound = await listGuildIdsForSubscription(input.subscriptionId);
  const otherGuild = bound.find((id) => id !== input.guildId);
  if (otherGuild) {
    logger.warn(
      {
        guildId: input.guildId,
        boundGuildId: otherGuild,
        subscriptionId: input.subscriptionId,
        userId: input.userId,
      },
      "Subscription already covers another server; not rebinding",
    );
    return;
  }

  const paidTier =
    isPlanTier(input.tier) && input.tier !== "free" ? input.tier : "pro";
  try {
    await upsertGuildEntitlement({
      guildId: input.guildId,
      tier: paidTier,
      subscriptionId: input.subscriptionId,
    });
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      logger.warn(
        { guildId: input.guildId, subscriptionId: input.subscriptionId },
        "Unique subscription_id race; leaving existing bind",
      );
      return;
    }
    throw error;
  }
}

async function resolveUserIdForStripe(input: {
  metadata?: Stripe.Metadata | null;
  customerId: string | null;
  clientReferenceId?: string | null;
}): Promise<string | null> {
  const fromMeta = metadataString(input.metadata, "userId");
  if (fromMeta) return fromMeta;
  const fromRef = input.clientReferenceId?.trim();
  if (fromRef) return fromRef;
  if (input.customerId) return getUserIdByCustomer(input.customerId);
  return null;
}

export async function applyStripeSubscription(
  sub: Stripe.Subscription,
  extra?: { userId?: string | null; guildId?: string | null },
): Promise<SubscriptionRow | null> {
  const customerId = stripeObjectId(sub.customer);
  const userId = await resolveUserIdForStripe({
    metadata: sub.metadata,
    customerId,
    clientReferenceId: extra?.userId,
  });
  if (!userId || !customerId) {
    logger.warn(
      { stripeSubscriptionId: sub.id },
      "Stripe subscription without userId or customer; ignoring",
    );
    return null;
  }

  await ensureBillingCustomer(userId, customerId);

  const priceId = priceIdFromSubscription(sub);
  const mappedTier = tierFromPriceId(priceId, stripePriceEnv());
  const status = normalizeStripeStatus(sub.status);
  const paid = isPaidStripeStatus(sub.status);
  const existing = await getSubscriptionByStripeId(sub.id);
  const tier: PlanTier = paid
    ? (mappedTier ??
      (isPlanTier(existing?.tier) && existing!.tier !== "free"
        ? existing!.tier
        : "pro"))
    : "pro";

  const row = await upsertSubscriptionRow({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    tier: paid
      ? tier
      : existing && isPlanTier(existing.tier)
        ? existing.tier
        : tier,
    status,
    currentPeriodEnd: periodEndFromSubscription(sub),
    cancelAt: cancelAtFromSubscription(sub),
  });

  const effectiveTier: PlanTier = paid ? paidTierOrPro(tier) : "free";
  await setTierForSubscriptionGuilds(row.id, effectiveTier);

  const guildId = extra?.guildId ?? metadataString(sub.metadata, "guildId");
  if (paid && guildId) {
    try {
      await assignGuildToSubscription({
        guildId,
        subscriptionId: row.id,
        tier: effectiveTier,
        userId,
      });
    } catch (error: unknown) {
      if (
        error instanceof HttpError &&
        error.code === "GUILD_ALREADY_COVERED"
      ) {
        logger.warn(
          { guildId, subscriptionId: row.id },
          "Server already covered by another subscription",
        );
        return row;
      }
      throw error;
    }
  }

  return row;
}

export async function applyCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode !== "subscription") return;
  const stripe = getStripe();
  if (!stripe) return;

  const subId = stripeObjectId(session.subscription);
  const customerId = stripeObjectId(session.customer);
  const userId = await resolveUserIdForStripe({
    metadata: session.metadata,
    customerId,
    clientReferenceId: session.client_reference_id,
  });
  if (customerId && userId) {
    await ensureBillingCustomer(userId, customerId);
  }
  if (!subId) {
    logger.warn({ sessionId: session.id }, "Checkout without subscription id");
    return;
  }

  const sub = await stripe.subscriptions.retrieve(subId);
  await applyStripeSubscription(sub, {
    userId,
    guildId: metadataString(session.metadata, "guildId"),
  });
}

export async function applyInvoiceEvent(
  invoice: Stripe.Invoice,
): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;
  const sub = await stripe.subscriptions.retrieve(subId);
  await applyStripeSubscription(sub);
}

export async function getBillingStatus(input: {
  userId: string;
  guildId: string;
}) {
  const guildTier = await getGuildTier(input.guildId);
  const covering = await coveringSubscriptionForGuild(input.guildId);
  const customerId = await getBillingCustomer(input.userId);
  const paidCovering =
    covering && isPaidSubscriptionStatus(covering.status) ? covering : null;
  const coveredByUser = Boolean(
    paidCovering && paidCovering.userId === input.userId,
  );
  const coveredByOther = Boolean(
    paidCovering && paidCovering.userId !== input.userId,
  );

  const subscriptionView =
    coveredByUser &&
    covering &&
    isSubscriptionStatus(covering.status) &&
    isPlanTier(covering.tier)
      ? {
          id: covering.id,
          tier: covering.tier,
          status: covering.status,
          currentPeriodEnd: covering.currentPeriodEnd?.toISOString() ?? null,
          cancelAt: covering.cancelAt?.toISOString() ?? null,
          owner: true,
        }
      : null;

  return {
    configured: stripeReady(),
    pricesConfigured: stripePricesConfigured(),
    hasCustomer: Boolean(customerId),
    guild: {
      guildId: input.guildId,
      tier: guildTier,
      coveredByUser,
      coveredByOther,
    },
    subscription: subscriptionView,
  };
}

async function assertGuildAvailableForCheckout(
  userId: string,
  guildId: string,
): Promise<void> {
  const covering = await coveringSubscriptionForGuild(guildId);
  if (!covering || !isPaidSubscriptionStatus(covering.status)) return;
  if (
    guildCoveredByOtherPayer(userId, {
      userId: covering.userId,
      status: covering.status,
    })
  ) {
    throw new HttpError(
      "This server is already covered by another subscription.",
      409,
      "GUILD_ALREADY_COVERED",
    );
  }
  throw new HttpError(
    "This server already has an active subscription. Use the portal to change plans.",
    409,
    "ALREADY_SUBSCRIBED",
  );
}

export async function createCheckoutSession(input: {
  userId: string;
  guildId: string;
  tier: PaidPlanTier;
}): Promise<{ url: string }> {
  const stripe = requireStripe();
  const priceId = priceIdForTier(input.tier);
  await assertGuildAvailableForCheckout(input.userId, input.guildId);

  const customerId = await getOrCreateStripeCustomer(input.userId);

  const base = publicAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/dashboard/billing?checkout=success`,
    cancel_url: `${base}/dashboard/billing?checkout=canceled`,
    client_reference_id: input.userId,
    allow_promotion_codes: true,
    metadata: {
      userId: input.userId,
      guildId: input.guildId,
      tier: input.tier,
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
        guildId: input.guildId,
        tier: input.tier,
      },
    },
  });

  if (!session.url) {
    throw new HttpError(
      "Stripe did not return a checkout URL.",
      502,
      "STRIPE_CHECKOUT_FAILED",
    );
  }
  return { url: session.url };
}

export async function createPortalSession(input: {
  userId: string;
}): Promise<{ url: string }> {
  const stripe = requireStripe();
  const customerId = await getBillingCustomer(input.userId);
  if (!customerId) {
    throw new HttpError(
      "There is no Stripe customer for this account.",
      404,
      "STRIPE_CUSTOMER_MISSING",
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${publicAppUrl()}/dashboard/billing`,
  });
  return { url: session.url };
}
