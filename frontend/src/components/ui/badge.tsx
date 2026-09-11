import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-full font-mono font-bold uppercase tracking-[0.14em]",
  {
    variants: {
      tone: {
        neutral:
          "border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground",
        free: "border border-[var(--border-strong)] bg-[var(--bg-inset)] text-[var(--tier-free)]",
        pro: "border border-primary bg-primary text-primary-foreground",
      },
      size: {
        sm: "h-[18px] px-1.5 text-[10px]",
        md: "h-[22px] px-2 text-[11px]",
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

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  const planSize =
    tone === "free" || tone === "pro" ? (size ?? "md") : size;
  return (
    <span
      className={cn(badgeVariants({ tone, size: planSize }), className)}
      {...props}
    />
  );
}
