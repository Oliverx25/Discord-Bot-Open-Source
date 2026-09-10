import * as React from "react";

/**
 * A single Tobot module. Two layouts from one component:
 * `card` is a physical slab that carries the same hard shadow as Button and bottoms out when pressed;
 * `row` is the dense list line that fits all 18 modules without scrolling.
 * @startingPoint section="Product" subtitle="Module slab and dense row" viewport="700x240"
 */
export interface ModuleCardProps {
  name?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  enabled?: boolean;
  tier?: "free" | "pro";
  stat?: React.ReactNode;
  onToggle?: React.ReactNode;
  onOpen?: (e: React.MouseEvent) => void;
  locked?: boolean;
  /** One-time spark (✦) on the icon well — module switched on for the first time. Never loops. */
  celebrate?: boolean;
  layout?: "card" | "row";
  index?: number;
  style?: React.CSSProperties;
}
export function ModuleCard(props: ModuleCardProps): JSX.Element;
