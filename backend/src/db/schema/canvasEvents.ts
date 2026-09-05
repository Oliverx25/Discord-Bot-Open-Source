import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Config canvas para eventos automatizados: leave | ban | boost.
 * Misma forma que welcome_settings (sin welcome_mode).
 */
export const canvasEventSettings = pgTable(
  "canvas_event_settings",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    /** `leave` | `ban` | `boost` */
    eventType: text().notNull(),
    channelId: text(),
    isEnabled: boolean().notNull().default(false),
    backgroundUrl: text(),
    bgFilepath: text(),
    blurAmount: integer().notNull().default(4),
    primaryText: text().notNull().default("See you soon!"),
    secondaryText: text().notNull().default("{username}"),
    messageContent: text().notNull().default("{user}"),
    avatarX: integer().notNull().default(960),
    avatarY: integer().notNull().default(380),
    avatarSize: integer().notNull().default(280),
    avatarBorderWidth: integer().notNull().default(8),
    avatarBorderColor: text().notNull().default("#FFFFFF"),
    textX: integer().notNull().default(960),
    textY: integer().notNull().default(560),
    fontSize: integer().notNull().default(64),
    textColor: text().notNull().default("#FFFFFF"),
    /** WelcomeTextLayer[] — documento tipado, nullable. */
    textLayers: jsonb().$type<unknown[]>(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.eventType] })],
);

export type CanvasEventSettings = typeof canvasEventSettings.$inferSelect;
export type NewCanvasEventSettings = typeof canvasEventSettings.$inferInsert;
