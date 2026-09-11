import { PLAN_TIER_LABEL, type PlanTier } from "@adobos/shared";
import { ArrowUpRight, Briefcase, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PanelPlanCard({ tier }: { tier: PlanTier }) {
  const paid = tier !== "free";

  if (paid) {
    const PlanIcon = tier === "business" ? Briefcase : Crown;

    return (
      <Button
        href="/dashboard/billing"
        variant="outline"
        size="sm"
        aria-label={`${PLAN_TIER_LABEL[tier]} plan`}
        className="group relative h-9 w-full justify-start gap-2.5 rounded-[var(--radius-md)] px-3 pr-9 font-sans text-[12px] font-semibold normal-case tracking-normal"
      >
        <PlanIcon
          className="size-4 shrink-0 text-primary"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="min-w-0 truncate">{PLAN_TIER_LABEL[tier]} plan</span>
        <ArrowUpRight
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden
        />
      </Button>
    );
  }

  const faceClassName =
    "tobot-plan-card__face relative block min-h-20 w-full rounded-[var(--radius-md)] border border-primary bg-primary p-3 text-left font-sans font-normal leading-normal normal-case tracking-normal text-primary-foreground whitespace-normal hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]";

  return (
    <a
      href="/dashboard/billing"
      className="tobot-plan-card tobot-plan-card--accent group"
    >
      <div className={faceClassName}>
        <div className="flex min-w-0 items-start gap-2.5 pr-7">
          <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-primary-foreground/10">
            <Zap className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-semibold leading-tight">
              Upgrade Plan
            </span>
            <span className="font-mono text-[10px] leading-relaxed opacity-75">
              Unlock exclusive features and higher limits.
            </span>
          </span>
        </div>
        <ArrowUpRight
          className="pointer-events-none absolute right-3 top-3 size-4 text-primary-foreground"
          aria-hidden
        />
      </div>
    </a>
  );
}
