import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Anti-Raid por guild. lockdown_snapshot y umbrales nuke son JSON texto.
 */
export const antiRaidSettings = pgTable("anti_raid_settings", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  enabled: boolean().notNull().default(false),
  alertChannelId: text(),
  joinFloodEnabled: boolean().notNull().default(true),
  joinCount: integer().notNull().default(10),
  joinWindowSeconds: integer().notNull().default(10),
  joinAction: text().notNull().default("kick"),
  accountAgeEnabled: boolean().notNull().default(false),
  accountAgeDays: integer().notNull().default(7),
  accountAgeAction: text().notNull().default("kick"),
  lockdownJoinAction: text().notNull().default("timeout"),
  timeoutSeconds: integer().notNull().default(3600),
  whitelistRoleIds: text().notNull().default("[]"),
  nukeEnabled: boolean().notNull().default(false),
  nukeWindowSeconds: integer().notNull().default(10),
  nukePunishment: text().notNull().default("strip"),
  nukeThresholds: text().notNull().default("{}"),
  nukeWhitelistUserIds: text().notNull().default("[]"),
  nukeWhitelistRoleIds: text().notNull().default("[]"),
  lockdownActive: boolean().notNull().default(false),
  lockdownStartedAt: timestamp({
    withTimezone: true,
    mode: "date",
  }),
  lockdownByUserId: text(),
  lockdownSnapshot: text().notNull().default("[]"),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AntiRaidSettingsRow = typeof antiRaidSettings.$inferSelect;
