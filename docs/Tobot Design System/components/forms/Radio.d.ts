import * as React from "react";

/** Exclusive choice group of 2–4 options. The only circular control in the system. */
export interface RadioOption { value: string; label: React.ReactNode; hint?: React.ReactNode }
export interface RadioProps {
  options?: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  label?: React.ReactNode;
  direction?: "row" | "column";
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function Radio(props: RadioProps): JSX.Element;
