import { PLAN_TIER_LABEL, type PlanTier } from "@adobos/shared";
import { Badge } from "@/components/ui/badge";

export function PanelPlanCard({ tier }: { tier: PlanTier }) {
  const paid = tier !== "free";

  return (
    <a
      href="/dashboard/billing"
      className="block rounded-md border border-primary bg-[var(--bg-tint-accent)] p-2.5 hover:border-[var(--accent-hover)]"
    >
      {paid ? (
        <div className="flex flex-col gap-1">
          <Badge className="w-fit border-primary/40 bg-transparent text-primary">
            {PLAN_TIER_LABEL[tier]}
          </Badge>
          <span className="text-[13px] font-semibold">Plan and billing</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            This server · {PLAN_TIER_LABEL[tier]}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold">Upgrade this server</span>
          <span className="font-mono text-[10px] text-[var(--text-secondary)]">
            One subscription per community
          </span>
        </div>
      )}
    </a>
  );
}
