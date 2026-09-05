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
 * Formularios interactivos (Discord Modals) — varios por guild.
 */
export const guildForms = pgTable("guild_forms", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  guildId: text()
    .notNull()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  modalTitle: text().notNull().default("Form"),
  buttonLabel: text().notNull().default("Open form"),
  embedTitle: text().notNull().default("Server form"),
  embedDescription: text()
    .notNull()
    .default("Click the button to fill out the form."),
  embedColor: text().notNull().default("#5865F2"),
  embedImageUrl: text(),
  embedThumbnailUrl: text(),
  publishChannelId: text(),
  receptionChannelId: text(),
  /** FormQuestion[] — documento tipado. */
  questions: jsonb().$type<unknown[]>().notNull().default([]),
  cooldownMinutes: integer().notNull().default(0),
  enabled: boolean().notNull().default(true),
  /** cooldown | once */
  submitMode: text().notNull().default("cooldown"),
  /** snowflake[] — documento tipado. */
  requiredRoleIds: jsonb().$type<string[]>().notNull().default([]),
  /** snowflake[] — documento tipado. */
  blockedRoleIds: jsonb().$type<string[]>().notNull().default([]),
  pingRoleId: text(),
  thankYouMessage: text().notNull().default(""),
  acceptRoleId: text(),
  publishedChannelId: text(),
  publishedMessageId: text(),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type GuildFormRow = typeof guildForms.$inferSelect;
export type NewGuildFormRow = typeof guildForms.$inferInsert;

/**
 * Respuestas enviadas a formularios.
 */
export const formResponses = pgTable(
  "form_responses",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    formId: integer()
      .notNull()
      .references(() => guildForms.id, { onDelete: "cascade" }),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    username: text().notNull().default(""),
    displayName: text().notNull().default(""),
    avatarUrl: text(),
    /** FormAnswerEntry[] — documento tipado. */
    answers: jsonb().$type<unknown[]>().notNull().default([]),
    /** pending | accepted | rejected */
    status: text().notNull().default("pending"),
    reviewedBy: text(),
    reviewedAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_form_responses_form").on(table.formId, table.createdAt),
    index("idx_form_responses_user").on(
      table.formId,
      table.userId,
      table.createdAt,
    ),
  ],
);

export type FormResponseRow = typeof formResponses.$inferSelect;
export type NewFormResponseRow = typeof formResponses.$inferInsert;

/**
 * @deprecated Tabla legacy 1:1 por guild. Migrada a `guild_forms`.
 */
export const interactiveForms = pgTable("interactive_forms", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  modalTitle: text().notNull().default("Form"),
  buttonLabel: text().notNull().default("Open form"),
  embedTitle: text().notNull().default("Server form"),
  embedDescription: text()
    .notNull()
    .default("Click the button to fill out the form."),
  embedColor: text().notNull().default("#5865F2"),
  publishChannelId: text(),
  receptionChannelId: text(),
  questions: text().notNull().default("[]"),
  publishedChannelId: text(),
  publishedMessageId: text(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type InteractiveFormsRow = typeof interactiveForms.$inferSelect;
export type NewInteractiveFormsRow = typeof interactiveForms.$inferInsert;
