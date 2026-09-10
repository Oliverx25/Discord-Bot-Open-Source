import * as React from "react";

/** Timezone picker for scheduled messages — Tobot stores a timezone per message, so this appears next to every schedule field. */
export interface TimezoneSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  zones?: { value: string; label: string; offset: string }[];
  preview?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function TimezoneSelect(props: TimezoneSelectProps): JSX.Element;
