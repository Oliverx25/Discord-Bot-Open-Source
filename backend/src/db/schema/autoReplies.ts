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
 * Auto-Replies: trigger de texto → respuesta. No es Custom Command (slash).
 */
export const autoReplies = pgTable(
  "auto_replies",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    trigger: text().notNull(),
    matchMode: text().notNull().default("contains"),
    response: text().notNull(),
    enabled: boolean().notNull().default(true),
    caseSensitive: boolean().notNull().default(false),
    wholeWord: boolean().notNull().default(false),
    useReply: boolean().notNull().default(true),
    cooldownSeconds: integer().notNull().default(0),
    allowedChannelIds: jsonb().$type<string[]>().notNull().default([]),
    ignoredChannelIds: jsonb().$type<string[]>().notNull().default([]),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("idx_auto_replies_guild").on(table.guildId)],
);

export type AutoReplyRow = typeof autoReplies.$inferSelect;
