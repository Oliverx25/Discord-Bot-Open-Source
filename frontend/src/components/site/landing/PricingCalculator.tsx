import { useState } from "react";
import { BILLING_PLAN_PRICES, formatUsd } from "@adobos/shared";
import { Slider } from "@/components/ui/slider";
import { RIVAL_COST_PER_SERVER } from "@/content/landing";

export function PricingCalculator() {
  const [servers, setServers] = useState(3);
  const rival = servers * RIVAL_COST_PER_SERVER;
  const pro = servers * BILLING_PLAN_PRICES.pro.monthlyUsd;

  return (
    <div className="mt-8 rounded-lg border border-border bg-card p-5">
      <p className="mb-3 text-sm font-medium">Servers you upgrade</p>
      <Slider
        min={1}
        max={12}
        step={1}
        value={[servers]}
        onValueChange={(value) => setServers(value[0] ?? 1)}
        aria-label="Servers you upgrade"
      />
      <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
        <span>1</span>
        <span>12</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-md border border-border p-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Typical stack
          </span>
          <p className="mt-1.5 font-mono text-[22px] text-destructive">
            {formatUsd(rival)}
            <span className="text-xs text-muted-foreground">/mo</span>
          </p>
        </div>
        <div className="rounded-md border border-primary bg-[var(--bg-tint-accent)] p-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Tobot Pro
          </span>
          <p className="mt-1.5 font-mono text-[22px]">
            {formatUsd(pro)}
            <span className="text-xs text-muted-foreground">/mo</span>
          </p>
        </div>
      </div>
    </div>
  );
}
