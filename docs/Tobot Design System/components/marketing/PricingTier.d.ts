import * as React from "react";

/** Plan card for the landing page. Free is never dimmed: 15 of 18 modules are free and that is the pitch. */
/**
 * @startingPoint section="Marketing" subtitle="Free and Pro plan cards" viewport="700x340"
 */
export interface PricingTierProps {
  name?: React.ReactNode;
  price?: React.ReactNode;
  period?: React.ReactNode;
  tagline?: React.ReactNode;
  features?: (string | { label: React.ReactNode; included?: boolean })[];
  cta?: React.ReactNode;
  featured?: boolean;
  badge?: React.ReactNode;
  note?: React.ReactNode;
  style?: React.CSSProperties;
}
export function PricingTier(props: PricingTierProps): JSX.Element;
