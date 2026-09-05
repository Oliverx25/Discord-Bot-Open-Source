import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Giveaways: ajustes por guild. La urna es Postgres; el mensaje es el anuncio.
 */
export const giveawaySettings = pgTable("giveaway_settings", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  managerRoleIds: text().notNull().default("[]"),
  dmWinners: boolean().notNull().default(true),
  pingRoleId: text(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type GiveawaySettingsRow = typeof giveawaySettings.$inferSelect;

export const giveaways = pgTable(
  "giveaways",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    channelId: text().notNull(),
    messageId: text(),
    prize: text().notNull(),
    description: text().notNull().default(""),
    winnerCount: integer().notNull().default(1),
    status: text().notNull().default("scheduled"),
    startsAt: timestamp({
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endsAt: timestamp({
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endedAt: timestamp({ withTimezone: true, mode: "date" }),
    /** Lease del productor de cola (SKIP LOCKED). NULL = libre. */
    claimedUntil: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    createdBy: text().notNull(),
    requiredRoleIds: text().notNull().default("[]"),
    blockedRoleIds: text().notNull().default("[]"),
    minGuildAgeDays: integer().notNull().default(0),
    minAccountAgeDays: integer().notNull().default(0),
    winnerIds: text().notNull().default("[]"),
    pastWinnerIds: text().notNull().default("[]"),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_giveaways_guild_status").on(table.guildId, table.status),
    index("idx_giveaways_ends_at").on(table.endsAt),
    index("idx_giveaways_starts_at").on(table.startsAt),
  ],
);

export type GiveawayRow = typeof giveaways.$inferSelect;

export const giveawayEntries = pgTable(
  "giveaway_entries",
  {
    giveawayId: integer()
      .notNull()
      .references(() => giveaways.id, { onDelete: "cascade" }),
    userId: text().notNull(),
    enteredAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.giveawayId, table.userId] }),
    index("idx_giveaway_entries_giveaway").on(table.giveawayId),
  ],
);

export type GiveawayEntryRow = typeof giveawayEntries.$inferSelect;
