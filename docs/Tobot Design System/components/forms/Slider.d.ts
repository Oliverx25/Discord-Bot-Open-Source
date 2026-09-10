import * as React from "react";

/** Range input for the pricing calculator, XP rates and thresholds. The current value is always shown in large mono. */
export interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  label?: React.ReactNode;
  valueLabel?: React.ReactNode;
  unit?: React.ReactNode;
  onChange?: (value: number) => void;
  disabled?: boolean;
  ticks?: React.ReactNode[];
  style?: React.CSSProperties;
}
export function Slider(props: SliderProps): JSX.Element;
