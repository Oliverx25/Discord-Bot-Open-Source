import {
  boolean,
  index,
  integer,
  jsonb,
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
  /** { messages, members, server, assets } — documento tipado. */
  channelsMapping: jsonb()
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  ignoredChannels: jsonb().$type<string[]>().notNull().default([]),
  ignoredRoles: jsonb().$type<string[]>().notNull().default([]),
  ignoreBots: boolean().notNull().default(true),
  /** Record<eventKey, boolean> — documento tipado. */
  enabledEvents: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  /** Días de retención del historial; 0 = sin límite. */
  dataRetentionDays: integer().notNull().default(14),
  /** { [channelId]: webhookId } — documento tipado. */
  webhooksMapping: jsonb()
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
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
    /** Detalles/diff — documento tipado. */
    details: jsonb().$type<Record<string, unknown>>().notNull().default({}),
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
