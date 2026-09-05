import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Configuración global de economía por guild.
 */
export const economyConfig = pgTable("economy_config", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  isActive: boolean().notNull().default(false),
  currencyName: text().notNull().default("Adobos Coins"),
  currencySymbol: text().notNull().default("🪙"),
  startBalance: integer().notNull().default(0),
  transferTax: integer().notNull().default(0),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type EconomyConfigRow = typeof economyConfig.$inferSelect;
export type NewEconomyConfigRow = typeof economyConfig.$inferInsert;

/**
 * Saldos de economía por usuario/guild.
 */
export const userEconomy = pgTable(
  "user_economy",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    wallet: integer().notNull().default(0),
    bank: integer().notNull().default(0),
    /** Racha de /daily. */
    dailyStreak: integer().notNull().default(0),
    /** Última reclamación de /daily (ms). null = nunca. */
    lastDailyAt: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    /** Última reclamación de /weekly. */
    lastWeeklyAt: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    /** Última reclamación de /monthly. */
    lastMonthlyAt: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.userId] })],
);

export type UserEconomyRow = typeof userEconomy.$inferSelect;
export type NewUserEconomyRow = typeof userEconomy.$inferInsert;

/**
 * Apuesta de blackjack cobrada mientras la mano vive en memoria.
 * Si el proceso muere, el arranque reembolsa `bet`.
 */
export const economyBlackjackOpen = pgTable(
  "economy_blackjack_open",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    bet: integer().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.userId] })],
);

export type EconomyBlackjackOpenRow = typeof economyBlackjackOpen.$inferSelect;

/**
 * Cooldowns de comandos de economía (`work`, `crime`, etc.).
 */
export const economyCooldowns = pgTable(
  "economy_cooldowns",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    /** Clave: `work` | `crime` | … */
    commandKey: text().notNull(),
    availableAt: timestamp({
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.guildId, table.userId, table.commandKey],
    }),
  ],
);

export type EconomyCooldownRow = typeof economyCooldowns.$inferSelect;

/**
 * Config de ingresos: daily/weekly/monthly, rachas, salarios por rol,
 * trabajos (`/work`) y crímenes (`/crime`) — arrays JSON.
 */
export const economyIncome = pgTable("economy_income", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  dailyPay: integer().notNull().default(100),
  weeklyPay: integer().notNull().default(500),
  monthlyPay: integer().notNull().default(2000),
  streakEnabled: boolean().notNull().default(false),
  streakBonusPercent: integer().notNull().default(5),
  /** EconomyRoleSalary[] — documento tipado. */
  roleSalaries: jsonb().$type<unknown[]>().notNull().default([]),
  /** EconomyJob[] — documento tipado. */
  jobs: jsonb().$type<unknown[]>().notNull().default([]),
  /** EconomyCrime[] — documento tipado. */
  crimes: jsonb().$type<unknown[]>().notNull().default([]),
  /** EconomyRobConfig — documento tipado. */
  rob: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type EconomyIncomeRow = typeof economyIncome.$inferSelect;
export type NewEconomyIncomeRow = typeof economyIncome.$inferInsert;

/**
 * Catálogo de la tienda del servidor (`/shop`, `/buy`).
 */
export const economyShopItems = pgTable(
  "economy_shop_items",
  {
    id: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text().notNull().default(""),
    price: integer().notNull().default(0),
    icon: text().notNull().default("🛒"),
    /** null = infinito (almacenado como NULL). */
    stock: integer(),
    /** EconomyShopRewards (Smart Toggles) — documento tipado. */
    rewards: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    /** @deprecated Secuencia Shortcuts; se migra al leer. Documento tipado. */
    actionSequence: jsonb().$type<unknown[]>().default([]),
    /** @deprecated Legacy single-reward; se migra al leer. */
    rewardType: text(),
    /** @deprecated Documento tipado. */
    rewardConfig: jsonb().$type<Record<string, unknown>>().default({}),
    enabled: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("economy_shop_items_guild_idx").on(table.guildId)],
);

export type EconomyShopItemRow = typeof economyShopItems.$inferSelect;
export type NewEconomyShopItemRow = typeof economyShopItems.$inferInsert;

/**
 * Historial de compras de la tienda.
 */
export const economyPurchases = pgTable(
  "economy_purchases",
  {
    id: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    itemId: text().notNull(),
    itemName: text().notNull(),
    pricePaid: integer().notNull(),
    status: text().notNull().default("fulfilled"),
    /** Contexto libre de la compra — documento tipado. */
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("economy_purchases_guild_user_idx").on(table.guildId, table.userId),
  ],
);

export type EconomyPurchaseRow = typeof economyPurchases.$inferSelect;
export type NewEconomyPurchaseRow = typeof economyPurchases.$inferInsert;

/**
 * Boosts temporales comprados (XP / economía).
 */
export const economyUserBoosts = pgTable(
  "economy_user_boosts",
  {
    id: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    module: text().notNull(),
    multiplier: integer().notNull(),
    /** null = boost permanente. */
    expiresAt: timestamp({ withTimezone: true, mode: "date" }),
    purchaseId: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("economy_user_boosts_lookup_idx").on(
      table.guildId,
      table.userId,
      table.module,
    ),
  ],
);

export type EconomyUserBoostRow = typeof economyUserBoosts.$inferSelect;

/**
 * Roles custom creados por la tienda (para /myrole).
 */
export const economyOwnedRoles = pgTable(
  "economy_owned_roles",
  {
    id: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    roleId: text().notNull(),
    itemId: text(),
    purchaseId: text(),
    /** null = permanente. */
    expiresAt: timestamp({ withTimezone: true, mode: "date" }),
    /**
     * true = borrar el rol de Discord al expirar (creado por la tienda);
     * false = solo quitarlo del miembro (rol existente temporal).
     */
    deleteRoleOnExpire: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("economy_owned_roles_user_idx").on(table.guildId, table.userId),
  ],
);

export type EconomyOwnedRoleRow = typeof economyOwnedRoles.$inferSelect;

/**
 * Canales creados por la tienda (temporales o permanentes).
 */
export const economyOwnedChannels = pgTable(
  "economy_owned_channels",
  {
    id: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    userId: text().notNull(),
    channelId: text().notNull(),
    itemId: text(),
    purchaseId: text(),
    /** null = permanente. */
    expiresAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("economy_owned_channels_user_idx").on(table.guildId, table.userId),
  ],
);

export type EconomyOwnedChannelRow = typeof economyOwnedChannels.$inferSelect;

/**
 * Config del Casino por guild (límites globales + reglas por juego).
 */
export const economyCasino = pgTable("economy_casino", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  isActive: boolean().notNull().default(false),
  minBet: integer().notNull().default(10),
  maxBet: integer().notNull().default(10_000),
  /** EconomyCasinoCoinflipConfig — documento tipado. */
  coinflip: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  /** EconomyCasinoRouletteConfig — documento tipado. */
  roulette: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  /** EconomyCasinoBlackjackConfig — documento tipado. */
  blackjack: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  /** EconomyCasinoSlotsConfig — documento tipado. */
  slots: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type EconomyCasinoRow = typeof economyCasino.$inferSelect;
export type NewEconomyCasinoRow = typeof economyCasino.$inferInsert;
