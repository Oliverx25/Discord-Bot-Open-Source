import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Un tablón Starboard por guild. emojis / ignore_channel_ids son documentos jsonb tipados.
 */
export const starboardSettings = pgTable("starboard_settings", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  channelId: text(),
  /** string[] de claves unicode:/custom: */
  emojis: jsonb().$type<string[]>().notNull().default(["unicode:⭐"]),
  threshold: integer().notNull().default(3),
  enabled: boolean().notNull().default(false),
  allowSelfStar: boolean().notNull().default(false),
  allowBots: boolean().notNull().default(false),
  /** snowflake[] — documento tipado. */
  ignoreChannelIds: jsonb().$type<string[]>().notNull().default([]),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Copia en el canal del tablón. original_message_id es el mensaje fuente.
 */
export const starboardPosts = pgTable(
  "starboard_posts",
  {
    originalMessageId: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    channelId: text().notNull(),
    starboardMessageId: text().notNull(),
    starCount: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("starboard_posts_starboard_message").on(
      table.starboardMessageId,
    ),
    index("idx_starboard_posts_guild").on(table.guildId),
  ],
);

export type StarboardSettingsRow = typeof starboardSettings.$inferSelect;
export type StarboardPostRow = typeof starboardPosts.$inferSelect;
