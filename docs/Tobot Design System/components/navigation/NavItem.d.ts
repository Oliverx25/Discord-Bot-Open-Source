import * as React from "react";

/** One row of the dashboard sidebar: icon, label, optional badge. Active state is an ember wash + 600 weight. */
export interface NavItemProps {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
  collapsed?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export function NavItem(props: NavItemProps): JSX.Element;
