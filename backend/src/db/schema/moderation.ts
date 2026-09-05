import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Advertencias de moderación por usuario/servidor.
 */
export const warnings = pgTable(
  "warnings",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    moderatorId: text().notNull(),
    reason: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("idx_warnings_guild_user").on(table.guildId, table.userId)],
);

/**
 * Plantillas de embed reutilizables (moderación DM, anuncios, etc.).
 */
export const embedTemplates = pgTable("embed_templates", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  guildId: text()
    .notNull()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  name: text().notNull(),
  /** EmbedPayload — documento tipado. */
  embedData: jsonb().$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Mensajes embed enviados desde el panel (edición/borrado en vivo).
 */
export const sentEmbeds = pgTable(
  "sent_embeds",
  {
    id: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    channelId: text().notNull(),
    messageId: text().notNull(),
    title: text(),
    /** EmbedPayload + components — documento tipado. */
    embedData: jsonb().$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_sent_embeds_guild").on(table.guildId, table.createdAt),
  ],
);

/**
 * Registro de acciones de moderación del panel.
 */
export const modLogs = pgTable(
  "mod_logs",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    action: text().notNull(),
    targetUserId: text(),
    targetChannelId: text(),
    moderatorId: text().notNull(),
    reason: text().notNull().default(""),
    meta: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("idx_mod_logs_guild").on(table.guildId, table.createdAt)],
);

export type Warning = typeof warnings.$inferSelect;
export type NewWarning = typeof warnings.$inferInsert;
export type EmbedTemplate = typeof embedTemplates.$inferSelect;
export type NewEmbedTemplate = typeof embedTemplates.$inferInsert;
export type SentEmbed = typeof sentEmbeds.$inferSelect;
export type NewSentEmbed = typeof sentEmbeds.$inferInsert;
export type ModLog = typeof modLogs.$inferSelect;
export type NewModLog = typeof modLogs.$inferInsert;
