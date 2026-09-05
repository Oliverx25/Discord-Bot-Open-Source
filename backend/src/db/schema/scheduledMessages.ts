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
 * Scheduled Messages: horario persistido (`next_run_at`) por guild.
 */
export const scheduledMessages = pgTable(
  "scheduled_messages",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    channelId: text().notNull(),
    /** IANA timezone, ej. America/Mexico_City */
    timezone: text().notNull().default("UTC"),
    /** JSON: ScheduledFrequency */
    frequency: text().notNull().default("{}"),
    /** JSON: ScheduledEmbedData */
    embedData: text().notNull().default("{}"),
    content: text().notNull().default(""),
    pingRoleId: text(),
    isActive: boolean().notNull().default(true),
    nextRunAt: timestamp({ withTimezone: true, mode: "date" }),
    lastSentAt: timestamp({ withTimezone: true, mode: "date" }),
    /** Lease del productor de cola (SKIP LOCKED). NULL = libre. */
    claimedUntil: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_scheduled_messages_due").on(table.isActive, table.nextRunAt),
  ],
);

export type ScheduledMessageRow = typeof scheduledMessages.$inferSelect;
export type NewScheduledMessageRow = typeof scheduledMessages.$inferInsert;
