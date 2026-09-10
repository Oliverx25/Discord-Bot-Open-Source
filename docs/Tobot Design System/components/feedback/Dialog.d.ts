import * as React from "react";

/** Modal for confirmation and short forms. 12px radius, warm scrim, 200ms fade-up. */
export interface DialogProps {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
  tone?: "default" | "danger";
}
export function Dialog(props: DialogProps): JSX.Element | null;
