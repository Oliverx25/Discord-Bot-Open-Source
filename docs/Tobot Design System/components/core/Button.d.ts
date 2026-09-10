import * as React from "react";

/**
 * Primary action control. Mono uppercase label on a hard-shadowed slab that
 * bottoms out when pressed. Ember-free: the brand color is acid `--accent`.
 * @startingPoint section="Core" subtitle="Physical buttons, variants and states" viewport="700x180"
 */
export interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  as?: "button" | "a" | "div";
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export function Button(props: ButtonProps): JSX.Element;
