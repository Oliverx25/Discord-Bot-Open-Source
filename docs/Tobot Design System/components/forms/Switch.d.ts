import * as React from "react";

/**
 * Immediate on/off for a module or feature. Knob travels in 140ms with an ease-snap curve —
 * the state change is already saved when it lands.
 * @startingPoint section="Forms" subtitle="Module on/off toggle" viewport="700x140"
 */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  size?: "sm" | "md";
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function Switch(props: SwitchProps): JSX.Element;
