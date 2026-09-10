import * as React from "react";

/** Multi-select combobox for Discord channels, roles and members — the most used control in the dashboard. Values render as mono chips with their sigil. */
/**
 * @startingPoint section="Forms" subtitle="Discord channel and role picker" viewport="700x230"
 */
export interface ChannelPickerProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  options?: { value: string; label: string; meta?: React.ReactNode }[];
  value?: string[];
  onChange?: (value: string[]) => void;
  kind?: "channel" | "role" | "member";
  placeholder?: string;
  multiple?: boolean;
  max?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function ChannelPicker(props: ChannelPickerProps): JSX.Element;
