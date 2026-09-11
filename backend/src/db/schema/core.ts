import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Configuración por guild (núcleo).
 * Extensible sin romper plugins: campos nuevos se añaden aquí; flags de features van a plugins_enabled.
 */
export const guildSettings = pgTable("guild_settings", {
  guildId: text().primaryKey(),
  prefix: text().notNull().default("!"),
  /** Canal principal de Action Logs (null = sin logs configurados). */
  logChannelId: text(),
  welcomeEnabled: boolean().notNull().default(false),
  /** Zona IANA predeterminada para las funciones propias del bot. */
  botTimezone: text().notNull().default("UTC"),
  /** Idioma preferido para las respuestas nativas del bot en este servidor. */
  botLocale: text().notNull().default("en"),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Plugins opcionales por guild (minecraft, osu, valorant, gachas, alerts…).
 * PK compuesta: un registro por (servidor, plugin).
 */
export const pluginsEnabled = pgTable(
  "plugins_enabled",
  {
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    pluginName: text().notNull(),
    enabled: boolean().notNull().default(false),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.pluginName] })],
);

export type GuildSettings = typeof guildSettings.$inferSelect;
export type NewGuildSettings = typeof guildSettings.$inferInsert;
export type PluginEnabled = typeof pluginsEnabled.$inferSelect;
export type NewPluginEnabled = typeof pluginsEnabled.$inferInsert;

/** Valores semilla útiles en migraciones / seeds. */
export const DEFAULT_PLUGIN_NAMES = [
  "minecraft",
  "osu",
  "valorant",
  "gachas",
  "alerts",
] as const;
