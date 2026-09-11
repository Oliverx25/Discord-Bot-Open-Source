import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center font-mono font-bold uppercase tracking-[0.14em]",
  {
    variants: {
      tone: {
        neutral:
          "rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground",
        free: "h-[18px] rounded-full border border-[var(--border-strong)] bg-[var(--bg-hover)] px-1.5 text-[10px] text-[var(--text-secondary)]",
        pro: "h-[18px] rounded-full border border-primary bg-primary px-1.5 text-[10px] text-primary-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props} />
  );
}
