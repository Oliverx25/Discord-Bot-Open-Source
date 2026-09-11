import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BILLING_PLAN_PRICES,
  formatUsd,
  isPaidPlanTier,
  isPaidSubscriptionStatus,
  isUnlimited,
  minTierForFeature,
  PLAN_TIER_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  TIER_CATALOG,
  tierHasFeature,
  type BillingStatusResponse,
  type FeatureKey,
  type PaidPlanTier,
  type PlanTier,
} from "@adobos/shared";
import { ExternalLink, Loader2, Rocket, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToastBanner } from "@/components/ui/toast";
import { fetchBilling, startBillingPortal, startCheckout } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";
import { useGuildQuery } from "@/lib/query/useGuildQuery";

type Feedback = { kind: "idle" } | { kind: "error"; message: string };

type PlanRow = {
  feature: string;
  limit: string;
  access: "included" | PlanTier;
};

const FEATURE_ROWS: Array<{ feature: string; key: FeatureKey; limit: string }> =
  [
    {
      feature: "Bot branding",
      key: "branding",
      limit: "Custom name and avatar",
    },
    { feature: "Anti-nuke", key: "antinuke", limit: "Raid rollback" },
    { feature: "Backups", key: "backups", limit: "Server snapshots" },
    { feature: "Analytics", key: "analytics", limit: "Exports included" },
    { feature: "Public API", key: "public-api", limit: "REST access" },
    {
      feature: "Outbound webhooks",
      key: "outbound-webhooks",
      limit: "Fan-out",
    },
    { feature: "Staff roles", key: "staff-roles", limit: "Panel permissions" },
  ];

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { dateStyle: "medium" });
}

function formatCap(value: number, suffix?: string): string {
  if (isUnlimited(value)) return "Unlimited";
  return suffix ? `${value} ${suffix}` : String(value);
}

function formatStorageMb(mb: number): string {
  if (isUnlimited(mb)) return "Unlimited";
  if (mb >= 1024 && mb % 1024 === 0) return `${mb / 1024} GB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

function rowsForTier(tier: PlanTier): PlanRow[] {
  const limits = TIER_CATALOG[tier].limits;
  const limitRows: PlanRow[] = [
    {
      feature: "Log retention",
      limit: formatCap(limits.logRetentionDays, "days"),
      access: "included",
    },
    {
      feature: "Scheduled messages",
      limit: formatCap(limits.scheduledMessages),
      access: "included",
    },
    {
      feature: "Auto-replies",
      limit: formatCap(limits.autoReplies),
      access: "included",
    },
    {
      feature: "Custom commands",
      limit: formatCap(limits.customCommands),
      access: "included",
    },
    {
      feature: "Stream alerts",
      limit: formatCap(limits.streamAlerts),
      access: "included",
    },
    {
      feature: "File storage",
      limit: formatStorageMb(limits.storageMb),
      access: "included",
    },
  ];
  const featureRows = FEATURE_ROWS.map((row) => ({
    feature: row.feature,
    limit: row.limit,
    access: tierHasFeature(tier, row.key)
      ? ("included" as const)
      : minTierForFeature(row.key),
  }));
  return [...limitRows, ...featureRows];
}

function readCheckoutFlag(): "success" | "canceled" | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("checkout");
  if (value === "success") return "success";
  if (value === "canceled") return "canceled";
  return null;
}

function badgeTone(tier: PlanTier): "free" | "pro" {
  return tier === "free" ? "free" : "pro";
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function BillingFooter() {
  return (
    <footer className="border-t border-border/70 pt-5 text-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-primary"
            strokeWidth={1.75}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              Payments processed securely by Stripe.
            </p>
            <p className="mt-1 max-w-[52ch] leading-relaxed text-[var(--text-secondary)]">
              Card details stay with Stripe. Manage, update, or cancel your
              subscription from the Stripe customer portal.
            </p>
          </div>
        </div>

        <nav
          aria-label="Billing legal resources"
          className="flex shrink-0 flex-wrap gap-x-4 gap-y-2 font-medium"
        >
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-6 items-center gap-1 text-[var(--text-secondary)] underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            Stripe privacy
            <ExternalLink className="size-3" aria-hidden />
          </a>
          <a
            href="https://stripe.com/legal/consumer"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-6 items-center gap-1 text-[var(--text-secondary)] underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            Stripe terms
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function BillingDashboard({
  guildName = null,
}: {
  guildName?: string | null;
}) {
  const checkoutBanner = useMemo(() => readCheckoutFlag(), []);
  const waitingSince = useRef(Date.now());
  const announcedPaid = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [toast, setToast] = useState<{
    variant: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const query = useGuildQuery(queryKeys.billing, fetchBilling, {
    refetchInterval: (current) => {
      if (checkoutBanner !== "success") return false;
      const data = current.state.data as BillingStatusResponse | undefined;
      if (data?.guild.coveredByUser) return false;
      if (Date.now() - waitingSince.current > 15_000) return false;
      return 1500;
    },
  });

  useEffect(() => {
    if (!checkoutBanner || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("checkout")) return;
    url.searchParams.delete("checkout");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [checkoutBanner]);

  useEffect(() => {
    if (checkoutBanner === "canceled") {
      setToast({
        variant: "info",
        message: "Checkout canceled. Nothing was charged.",
      });
    }
  }, [checkoutBanner]);

  useEffect(() => {
    if (checkoutBanner !== "success") return;
    if (!query.data?.guild.coveredByUser) return;
    if (announcedPaid.current) return;
    announcedPaid.current = true;
    setToast({
      variant: "success",
      message: "This server is on the paid plan.",
    });
  }, [checkoutBanner, query.data?.guild.coveredByUser]);

  useEffect(() => {
    if (query.isError) {
      setFeedback({
        kind: "error",
        message:
          query.error instanceof Error
            ? query.error.message
            : "Couldn't load billing",
      });
    }
  }, [query.isError, query.error]);

  async function onCheckout(tier: PaidPlanTier): Promise<void> {
    setBusy(`checkout-${tier}`);
    setFeedback({ kind: "idle" });
    try {
      const { url } = await startCheckout(tier);
      window.location.assign(url);
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Couldn't start the payment.",
      });
      setBusy(null);
    }
  }

  async function onPortal(): Promise<void> {
    setBusy("portal");
    setFeedback({ kind: "idle" });
    try {
      const { url } = await startBillingPortal();
      window.location.assign(url);
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Couldn't open the portal.",
      });
      setBusy(null);
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading billing…
      </div>
    );
  }

  const data = query.data;
  const sub = data?.subscription ?? null;
  const guildTier = data?.guild.tier ?? "free";
  const paidHere = Boolean(sub && isPaidSubscriptionStatus(sub.status));
  const coveredByOther = Boolean(data?.guild.coveredByOther);
  const canCheckout =
    Boolean(data?.configured && data.pricesConfigured) &&
    !paidHere &&
    !coveredByOther;
  const canPortal = Boolean(data?.configured && data.hasCustomer);
  const serverLabel = guildName?.trim() || "this server";
  const activating = checkoutBanner === "success" && !data?.guild.coveredByUser;
  const pastDue = sub?.status === "past_due";
  const rows = rowsForTier(guildTier);
  const priceLabel = isPaidPlanTier(guildTier)
    ? formatUsd(BILLING_PLAN_PRICES[guildTier].monthlyUsd)
    : null;

  const invoiceAmount = paidHere && priceLabel ? priceLabel : "None";
  const invoiceDate = sub?.cancelAt
    ? formatDate(sub.cancelAt)
    : formatDate(sub?.currentPeriodEnd);
  const invoiceDateLabel = sub?.cancelAt
    ? "Cancels"
    : paidHere
      ? "Renews"
      : "Next charge";
  const invoiceDateValue = coveredByOther
    ? "Other account"
    : (invoiceDate ?? "None");

  return (
    <div className="billing-page flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          Billing
        </h2>
        <p className="max-w-[54ch] text-sm text-muted-foreground">
          Plan, invoices and limits for {serverLabel}. Receipts and cards live
          in Stripe.
        </p>
      </header>

      {activating && (
        <p className="rounded-md border border-primary bg-[var(--bg-tint-accent)] px-4 py-3 text-sm">
          Payment received. Activating this server…
        </p>
      )}
      {pastDue && (
        <p className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-destructive">
          The last payment for this server failed. Update the card in Stripe to
          keep the paid plan.
        </p>
      )}
      {feedback.kind === "error" && (
        <p className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-destructive">
          {feedback.message}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-base font-semibold">Overview</h3>
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current plan</CardTitle>
              <CardDescription>
                {coveredByOther
                  ? "Another account already pays for this community."
                  : "One Stripe subscription, this community only."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-2">
                <Badge tone={badgeTone(guildTier)} className="w-fit">
                  {PLAN_TIER_LABEL[guildTier]}
                </Badge>
                <p className="font-mono text-3xl font-semibold tracking-tight">
                  {priceLabel ? (
                    <>
                      {priceLabel}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        /month
                      </span>
                    </>
                  ) : (
                    "Free"
                  )}
                </p>
                {sub ? (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {SUBSCRIPTION_STATUS_LABEL[sub.status]}
                  </p>
                ) : null}
                {data && !data.configured ? (
                  <p className="max-w-[36ch] text-sm text-muted-foreground">
                    Stripe isn't configured in this environment. Checkout
                    activates with <code>STRIPE_SECRET_KEY</code> and the price
                    ids.
                  </p>
                ) : null}
              </div>

              {coveredByOther ? null : paidHere ? (
                <Button
                  type="button"
                  disabled={Boolean(busy) || !canPortal}
                  onClick={() => void onPortal()}
                >
                  {busy === "portal" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Manage billing
                </Button>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <Button
                    type="button"
                    disabled={Boolean(busy) || !canCheckout}
                    aria-label="Upgrade this server"
                    onClick={() => void onCheckout("pro")}
                  >
                    {busy === "checkout-pro" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Rocket className="size-4" aria-hidden />
                    )}
                    Upgrade
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary disabled:opacity-40"
                    disabled={Boolean(busy) || !canCheckout}
                    onClick={() => void onCheckout("business")}
                  >
                    Business · {BILLING_PLAN_PRICES.business.label}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next invoice</CardTitle>
              <CardDescription>
                {coveredByOther
                  ? "Billing for this server stays with the other account."
                  : "The next charge for this community. Invoices stay in Stripe."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <Stat value={invoiceAmount} label="Amount" />
                <Stat value={invoiceDateValue} label={invoiceDateLabel} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-base font-semibold">
            Limits on this server
          </h3>
          <p className="text-sm text-muted-foreground">
            What the {PLAN_TIER_LABEL[guildTier]} plan includes for{" "}
            {serverLabel}.
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Module
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  On this plan
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Access
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-5 py-2.5">{row.feature}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">
                    {row.limit}
                  </td>
                  <td className="px-5 py-2.5">
                    {row.access === "included" ? (
                      <span className="font-mono text-xs text-[var(--success)]">
                        Included
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {PLAN_TIER_LABEL[row.access]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <BillingFooter />
      <ToastBanner
        message={toast?.message ?? null}
        variant={toast?.variant ?? "info"}
        onDismiss={dismissToast}
      />
    </div>
  );
}
