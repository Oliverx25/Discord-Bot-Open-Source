import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Autoroles por reacción: un emoji en un mensaje concreto asigna/quita un rol.
 * emojiKey: `custom:<id>` o `unicode:<char>`
 */
export const reactionRoles = pgTable(
  "reaction_roles",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    channelId: text().notNull(),
    messageId: text().notNull(),
    emojiKey: text().notNull(),
    roleId: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.messageId, table.emojiKey] })],
);

/**
 * Roles automáticos al unirse (humanos vs bots).
 */
export const autoRoles = pgTable("auto_roles", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  /** string[] role IDs — documento tipado. */
  humanRoles: jsonb().$type<string[]>().notNull().default([]),
  /** string[] role IDs — documento tipado. */
  botRoles: jsonb().$type<string[]>().notNull().default([]),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Menú interactivo de autoroles (metadatos + mapping JSON).
 * @deprecated Preferir `autoroles_registry`.
 */
export const reactionRolesMenus = pgTable("reaction_roles_menus", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  guildId: text()
    .notNull()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  channelId: text().notNull(),
  messageId: text().notNull(),
  mode: text().notNull().default("reactions"),
  /** Mappings (emoji/button → role) — documento tipado. */
  rolesMapping: jsonb().$type<unknown>().notNull().default([]),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Registro persistente de menús de autoroles publicados.
 */
export const autorolesRegistry = pgTable("autoroles_registry", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  guildId: text()
    .notNull()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  channelId: text().notNull(),
  messageId: text().notNull(),
  title: text().notNull().default("Autoroles"),
  /** BUTTONS | SELECT | REACTIONS */
  type: text().notNull().default("BUTTONS"),
  /** [{ id, roleId, label, emojiKey, style }] — documento tipado. */
  rolesMapping: jsonb().$type<unknown[]>().notNull().default([]),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ReactionRole = typeof reactionRoles.$inferSelect;
export type NewReactionRole = typeof reactionRoles.$inferInsert;
export type AutoRoleRow = typeof autoRoles.$inferSelect;
export type NewAutoRoleRow = typeof autoRoles.$inferInsert;
export type ReactionRolesMenu = typeof reactionRolesMenus.$inferSelect;
export type NewReactionRolesMenu = typeof reactionRolesMenus.$inferInsert;
