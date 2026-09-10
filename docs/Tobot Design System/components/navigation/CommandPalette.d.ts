import * as React from "react";

/** Cmd-K palette: jump to a module, a server or a setting. The fastest path through a dashboard with 18 modules × N servers. */
/**
 * @startingPoint section="Navigation" subtitle="Cmd-K command palette" viewport="700x360"
 */
export interface CommandPaletteProps {
  open?: boolean;
  commands?: { label: React.ReactNode; group?: string; icon?: React.ReactNode; shortcut?: string; id?: string }[];
  placeholder?: string;
  hint?: string;
  onClose?: () => void;
  onRun?: (command: any) => void;
  style?: React.CSSProperties;
}
export function CommandPalette(props: CommandPaletteProps): JSX.Element;
