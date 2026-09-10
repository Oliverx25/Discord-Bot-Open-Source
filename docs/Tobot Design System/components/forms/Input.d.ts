import * as React from "react";

/**
 * Text field. Inset well + 1px border; focus is an ember border plus a soft ember wash.
 * Set `mono` for anything Discord owns (IDs, channel names, command bodies).
 * @startingPoint section="Forms" subtitle="Text fields, prefixes, errors" viewport="700x230"
 */
export interface InputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  mono?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  id?: string;
  style?: React.CSSProperties;
}
export function Input(props: InputProps): JSX.Element;
