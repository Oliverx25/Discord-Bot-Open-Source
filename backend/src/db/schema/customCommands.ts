import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Slash commands personalizados por guild.
 */
export const customCommands = pgTable(
  "custom_commands",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text().notNull().default("Custom command"),
    /** CustomCommandResponseData — documento tipado. */
    responseData: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    /** CustomCommandOptions — documento tipado. */
    options: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    /** CustomCommandPermissions — documento tipado. */
    permissions: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_custom_commands_guild_name").on(table.guildId, table.name),
  ],
);

export type CustomCommandRow = typeof customCommands.$inferSelect;
export type NewCustomCommandRow = typeof customCommands.$inferInsert;

/**
 * Permisos/visibilidad de slash commands nativos por guild.
 */
export const defaultCommandPermissions = pgTable(
  "default_command_permissions",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    commandName: text().notNull(),
    enabled: boolean().notNull().default(true),
    /** string[] role IDs — documento tipado. */
    allowedRoles: jsonb().$type<string[]>().notNull().default([]),
    /** string[] channel IDs donde el comando no se puede usar. */
    ignoredChannels: jsonb().$type<string[]>().notNull().default([]),
    ephemeral: boolean().notNull().default(false),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.commandName] })],
);

export type DefaultCommandPermissionRow =
  typeof defaultCommandPermissions.$inferSelect;
export type NewDefaultCommandPermissionRow =
  typeof defaultCommandPermissions.$inferInsert;
