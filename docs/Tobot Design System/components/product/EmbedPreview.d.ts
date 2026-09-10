import * as React from "react";

/** Live preview of the Discord embed the bot will post. Used by the embed builder, welcome cards and scheduled messages. */
/**
 * @startingPoint section="Product" subtitle="Discord embed preview" viewport="700x260"
 */
export interface EmbedPreviewProps {
  author?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  fields?: { name: React.ReactNode; value: React.ReactNode }[];
  footer?: React.ReactNode;
  timestamp?: React.ReactNode;
  color?: string;
  thumbnail?: boolean;
  image?: React.ReactNode;
  botName?: string;
  botTag?: string;
  style?: React.CSSProperties;
}
export function EmbedPreview(props: EmbedPreviewProps): JSX.Element;
