import * as React from "react";

/** Native single-select with Tobot chrome. Options are `{value,label}`. */
export interface SelectOption { value: string; label: string }
export interface SelectProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  label?: React.ReactNode;
  hint?: React.ReactNode;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}
export function Select(props: SelectProps): JSX.Element;
