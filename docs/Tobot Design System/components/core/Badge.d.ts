import * as React from "react";

/**
 * Pill status marker: plan tier, module state, log severity. The only pill-shaped
 * element in the system, which is what makes it read as status.
 * @startingPoint section="Core" subtitle="Tier and status pills" viewport="700x140"
 */
export interface BadgeProps {
  children?: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "free" | "pro";
  size?: "sm" | "md";
  dot?: boolean;
  uppercase?: boolean;
  style?: React.CSSProperties;
}
export function Badge(props: BadgeProps): JSX.Element;
