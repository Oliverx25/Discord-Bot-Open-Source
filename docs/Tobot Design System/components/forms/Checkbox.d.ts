import * as React from "react";

/** Multi-select boolean, e.g. which log events to route. Square 2px corners; ember fill when on. */
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
  indeterminate?: boolean;
  style?: React.CSSProperties;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
