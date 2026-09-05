import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Configuración de Levels por guild.
 */
export const xpConfig = pgTable("xp_config", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  enabled: boolean().notNull().default(false),
  textXpMin: integer().notNull().default(15),
  textXpMax: integer().notNull().default(25),
  cooldownSeconds: integer().notNull().default(60),
  voiceEnabled: boolean().notNull().default(false),
  voiceXpPerMinute: integer().notNull().default(10),
  /** Multiplicador al transmitir pantalla (1.0 = sin bonus). */
  streamMultiplier: real().notNull().default(1),
  xpMultiplier: integer().notNull().default(1),
  /** string[] — documento tipado. */
  ignoredRoles: jsonb().$type<string[]>().notNull().default([]),
  /** string[] — documento tipado. */
  ignoredChannels: jsonb().$type<string[]>().notNull().default([]),
  levelUpChannelId: text(),
  /** LevelsRoleMultiplier[] — documento tipado. */
  customMultipliers: jsonb().$type<unknown[]>().notNull().default([]),
  /** LevelsChannelMultiplier[] — documento tipado. */
  customChannelMultipliers: jsonb().$type<unknown[]>().notNull().default([]),
  /** TEXT | EMBED | IMAGE */
  levelUpFormat: text().notNull().default("TEXT"),
  levelUpMessage: text()
    .notNull()
    .default("🎉 {user} reached **level {level}**!"),
  levelUpEmbedTitle: text().notNull().default("Level Up!"),
  levelUpEmbedColor: text().notNull().default("#34E21D"),
  levelUpShowThumbnail: boolean().notNull().default(true),
  levelUpImage: text(),
  liveLeaderboardChannelId: text(),
  liveLeaderboardMessageId: text(),
  leaderboardEmbedTitle: text().notNull().default("🏆 Leaderboard"),
  leaderboardEmbedDescription: text().notNull().default(""),
  leaderboardEmbedColor: text().notNull().default("#CA7AFF"),
  leaderboardShowThumbnail: boolean().notNull().default(false),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Recompensas de rol por nivel. Un rol por (guild, level). */
export const xpRewards = pgTable(
  "xp_rewards",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    level: integer().notNull(),
    roleId: text().notNull(),
  },
  (table) => [
    uniqueIndex("idx_xp_rewards_guild_level").on(table.guildId, table.level),
  ],
);

/** Progreso de XP por usuario en un guild. */
export const userXp = pgTable(
  "user_xp",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    xp: integer().notNull().default(0),
    level: integer().notNull().default(0),
    /** Si está en el futuro, el usuario no gana XP (Auto Mod XP_FREEZE). */
    xpFrozenUntil: timestamp({
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.userId] })],
);

export type XpConfigRow = typeof xpConfig.$inferSelect;
export type NewXpConfigRow = typeof xpConfig.$inferInsert;
export type XpRewardRow = typeof xpRewards.$inferSelect;
export type NewXpRewardRow = typeof xpRewards.$inferInsert;
export type UserXpRow = typeof userXp.$inferSelect;
export type NewUserXpRow = typeof userXp.$inferInsert;
