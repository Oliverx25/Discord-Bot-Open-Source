import * as React from "react";

/** Onboarding and multi-step setup progress. Square markers, mono numbers, acid for done and current. */
export interface StepperProps {
  steps?: (string | { label?: React.ReactNode })[];
  current?: number;
  orientation?: "horizontal" | "vertical";
  onStepClick?: (index: number) => void;
  style?: React.CSSProperties;
}
export function Stepper(props: StepperProps): JSX.Element;
