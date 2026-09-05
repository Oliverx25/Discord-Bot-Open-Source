import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Configuración de Auto-delete por guild (reglas de borrado por canal).
 */
export const autoDeleteConfig = pgTable("auto_delete_config", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  enabled: boolean().notNull().default(false),
  /** JSON: AutoDeleteRule[] */
  rules: text().notNull().default("[]"),
  /** IANA timezone del cron SCHEDULED. */
  timezone: text().notNull().default("UTC"),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AutoDeleteConfigRow = typeof autoDeleteConfig.$inferSelect;
export type NewAutoDeleteConfigRow = typeof autoDeleteConfig.$inferInsert;

/** COUNTDOWN pendiente: el leader borra al vencer delete_at. */
export const autoDeletePending = pgTable(
  "auto_delete_pending",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    channelId: text().notNull(),
    messageId: text().notNull(),
    ruleChannelId: text().notNull(),
    deleteAt: timestamp({
      withTimezone: true,
      mode: "date",
    }).notNull(),
    /**
     * Lease: un tick del worker reclama la fila poniendo `claimed_until` en el
     * futuro antes de borrar en Discord. Otro worker la salta hasta que expire.
     * `null` = libre.
     */
    claimedUntil: timestamp({
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.guildId, table.messageId] }),
    index("idx_auto_delete_pending_due").on(table.deleteAt),
    index("idx_auto_delete_pending_rule").on(
      table.guildId,
      table.ruleChannelId,
    ),
  ],
);
