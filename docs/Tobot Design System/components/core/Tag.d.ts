import * as React from "react";

/** Square-cornered chip for user-supplied values: channels, roles, command names, filter words. */
export interface TagProps {
  children?: React.ReactNode;
  onRemove?: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
  mono?: boolean;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export function Tag(props: TagProps): JSX.Element;
