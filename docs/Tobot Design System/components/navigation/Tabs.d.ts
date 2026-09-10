import * as React from "react";

/**
 * Section switch within one subject. `underline` for page-level, `segmented` for in-card.
 * @startingPoint section="Navigation" subtitle="Underline and segmented tabs" viewport="700x150"
 */
export interface TabItem { value: string; label: React.ReactNode; icon?: React.ReactNode; count?: number }
export interface TabsProps {
  tabs?: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  variant?: "underline" | "segmented";
  size?: "sm" | "md";
  style?: React.CSSProperties;
}
export function Tabs(props: TabsProps): JSX.Element;
