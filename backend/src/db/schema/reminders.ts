import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Ajustes de Reminders por guild (timezone para `/remind at`).
 */
export const reminderSettings = pgTable("reminder_settings", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  timezone: text().notNull().default("UTC"),
  enabled: boolean().notNull().default(true),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Recordatorios personales pendientes. Se borran al disparar.
 */
export const reminders = pgTable(
  "reminders",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    channelId: text().notNull(),
    message: text().notNull(),
    dueAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    attempts: integer().notNull().default(0),
    /** Lease del productor de cola (SKIP LOCKED). NULL = libre. */
    claimedUntil: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_reminders_due").on(table.dueAt),
    index("idx_reminders_guild_user").on(table.guildId, table.userId),
  ],
);

export type ReminderSettingsRow = typeof reminderSettings.$inferSelect;
export type ReminderRow = typeof reminders.$inferSelect;
