import * as React from "react";

/** Empty screen with TO. The one place in the product where the mascot appears — never in billing or in a data table. */
/**
 * @startingPoint section="Feedback" subtitle="Empty state with the TO mascot" viewport="700x300"
 */
export interface EmptyStateProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  mood?: "idle" | "work" | "ok" | "alert" | "sleep";
  mascot?: boolean;
  /** One-time spark (✦) over the face — first command executed, module turned on for the first time. Pair with mood="ok". Never loops. */
  celebrate?: boolean;
  compact?: boolean;
  style?: React.CSSProperties;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
