import * as React from "react";

/** Inline message inside a panel or form — permission missing, quota reached, module disabled. Not a toast: it stays. */
export interface AlertProps {
  tone?: "info" | "success" | "warning" | "danger";
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}
export function Alert(props: AlertProps): JSX.Element;
