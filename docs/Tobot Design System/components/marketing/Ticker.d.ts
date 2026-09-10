import * as React from "react";

/** Acid marquee strip — a brand element, not decoration. One per page, at the very top. */
export interface TickerProps {
  items?: string[];
  separator?: string;
  speed?: number;
  tone?: "accent" | "inverse" | "quiet";
  height?: number;
  style?: React.CSSProperties;
}
export function Ticker(props: TickerProps): JSX.Element;
