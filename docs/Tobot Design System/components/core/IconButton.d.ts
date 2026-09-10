import * as React from "react";

/** Square icon-only control for toolbars, table rows and panel headers. Always pass `label`. */
export interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  variant?: "ghost" | "outline" | "solid";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export function IconButton(props: IconButtonProps): JSX.Element;
