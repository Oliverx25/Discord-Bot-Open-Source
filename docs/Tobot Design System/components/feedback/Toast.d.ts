import * as React from "react";

/** Transient confirmation, bottom-right. One line of what happened, plus an undo when one exists. */
export interface ToastProps {
  tone?: "success" | "danger" | "warning" | "info";
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}
export function Toast(props: ToastProps): JSX.Element;
