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
 * Configuración de Action Logs por guild (canales, filtros, eventos).
 */
export const actionLogsConfig = pgTable("action_logs_config", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  enabled: boolean().notNull().default(false),
  /** GLOBAL | CATEGORY */
  routingMode: text().notNull().default("GLOBAL"),
  globalChannelId: text(),
  /** JSON: { messages, members, server, assets } */
  channelsMapping: text().notNull().default("{}"),
  /** JSON: string[] */
  ignoredChannels: text().notNull().default("[]"),
  /** JSON: string[] */
  ignoredRoles: text().notNull().default("[]"),
  ignoreBots: boolean().notNull().default(true),
  /** JSON: Record<eventKey, boolean> */
  enabledEvents: text().notNull().default("{}"),
  /** Días de retención del historial; 0 = sin límite. */
  dataRetentionDays: integer().notNull().default(14),
  /** JSON: { [channelId]: webhookId } */
  webhooksMapping: text().notNull().default("{}"),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Historial de Action Logs capturados por discord.js.
 */
export const actionLogs = pgTable(
  "action_logs",
  {
    id: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    category: text().notNull(),
    eventType: text().notNull(),
    executorId: text(),
    executorTag: text(),
    targetId: text(),
    targetTag: text(),
    channelId: text(),
    summary: text().notNull().default(""),
    /** JSON con detalles / diff */
    details: text().notNull().default("{}"),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_action_logs_guild_created").on(table.guildId, table.createdAt),
  ],
);

export type ActionLogsConfigRow = typeof actionLogsConfig.$inferSelect;
export type NewActionLogsConfigRow = typeof actionLogsConfig.$inferInsert;
export type ActionLogRow = typeof actionLogs.$inferSelect;
export type NewActionLogRow = typeof actionLogs.$inferInsert;
