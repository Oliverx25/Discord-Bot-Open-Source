import * as React from "react";

/** Dropdown menu for row actions and account switching. Items are data; separators are `{separator:true}`. */
export interface MenuProps {
  trigger?: React.ReactNode;
  items?: { label?: React.ReactNode; icon?: React.ReactNode; shortcut?: string; tone?: "default" | "danger"; disabled?: boolean; separator?: boolean; onSelect?: () => void }[];
  align?: "left" | "right";
  width?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: React.CSSProperties;
}
export function Menu(props: MenuProps): JSX.Element;
