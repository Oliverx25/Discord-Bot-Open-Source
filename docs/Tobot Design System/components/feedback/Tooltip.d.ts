import * as React from "react";

/** One short line explaining an icon or a truncated value. Never holds instructions or links. */
export interface TooltipProps {
  label: React.ReactNode;
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  mono?: boolean;
  style?: React.CSSProperties;
}
export function Tooltip(props: TooltipProps): JSX.Element;
