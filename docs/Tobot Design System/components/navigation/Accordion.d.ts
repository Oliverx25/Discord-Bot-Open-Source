import * as React from "react";

/** Disclosure list for FAQ and long settings. Hairline rules, mono +/- marker, one open at a time by default. */
export interface AccordionProps {
  items?: { title?: React.ReactNode; content?: React.ReactNode }[];
  defaultOpen?: number;
  allowMultiple?: boolean;
  style?: React.CSSProperties;
}
export function Accordion(props: AccordionProps): JSX.Element;
