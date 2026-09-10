import * as React from "react";

/**
 * Bordered surface panel — the dashboard's basic container. 8px radius, 1px border,
 * shadow only on `raised`.
 * @startingPoint section="Core" subtitle="Panel surface with header, body and footer" viewport="700x220"
 */
export interface CardProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  tone?: "default" | "raised" | "accent" | "inset";
  interactive?: boolean;
  style?: React.CSSProperties;
}
export function Card(props: CardProps): JSX.Element;
