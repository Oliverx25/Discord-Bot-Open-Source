import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Presencia global del bot (singleton).
 * Discord limpia Presence al reiniciar → se reaplica desde esta tabla en `ready`.
 */
export const botPresenceSettings = pgTable("bot_presence_settings", {
  /** Siempre `default` (una sola fila). */
  id: text().primaryKey().default("default"),
  status: text().notNull().default("online"),
  activityType: text().notNull().default("Playing"),
  activityName: text().notNull().default(""),
  streamUrl: text(),
  state: text().notNull().default(""),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type BotPresenceSettings = typeof botPresenceSettings.$inferSelect;
export type NewBotPresenceSettings = typeof botPresenceSettings.$inferInsert;
