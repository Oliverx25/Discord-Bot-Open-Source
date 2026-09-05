import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Alertas de stream por guild. Una fila = un canal de Twitch/YouTube/Kick.
 * is_live / live_id evitan reanunciar el mismo directo tras un restart.
 */
export const streamAlerts = pgTable(
  "stream_alerts",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    platform: text().notNull(),
    handle: text().notNull(),
    displayName: text().notNull(),
    discordChannelId: text().notNull(),
    mentionRoleId: text(),
    template: text().notNull().default("{name} is live: {title}\n{url}"),
    enabled: boolean().notNull().default(true),
    isLive: boolean().notNull().default(false),
    liveId: text(),
    lastTitle: text(),
    lastCheckedAt: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    lastLiveAt: timestamp({
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
    uniqueIndex("stream_alerts_guild_platform_handle").on(
      table.guildId,
      table.platform,
      table.handle,
    ),
    index("idx_stream_alerts_guild").on(table.guildId),
    index("idx_stream_alerts_enabled").on(table.enabled),
  ],
);

export type StreamAlertRow = typeof streamAlerts.$inferSelect;
