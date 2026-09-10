import * as React from "react";

/** Loading placeholder: an inset block that pulses opacity. No shimmer sweep, no gradient. */
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: string;
  lines?: number;
  gap?: number;
  circle?: boolean;
  style?: React.CSSProperties;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
