import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Configuración de Auto Mod por guild (filtros, exclusiones, canal de alertas).
 * Las infracciones se registran en `warnings` (sin tabla de strikes propia).
 */
export const autoModConfig = pgTable("auto_mod_config", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  enabled: boolean().notNull().default(false),
  /** JSON: AutoModFilters */
  filters: text().notNull().default("{}"),
  /** JSON: string[] */
  ignoredRoles: text().notNull().default("[]"),
  /** JSON: string[] */
  ignoredChannels: text().notNull().default("[]"),
  logChannelId: text(),
  /** Días para caducidad de Warns activos; 0 = nunca. */
  warnDecayDays: integer().notNull().default(30),
  /** Registrar warn en cada hit de filtro (default: sí, comportamiento histórico). */
  warnOnHit: boolean().notNull().default(true),
  /** DM al usuario junto al warn. Ignorado si warnOnHit es false. */
  dmOnHit: boolean().notNull().default(true),
  /** Saltar Administrator / ManageMessages. */
  skipStaff: boolean().notNull().default(false),
  /** JSON: AutoModPunishment[] */
  punishments: text().notNull().default("[]"),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AutoModConfigRow = typeof autoModConfig.$inferSelect;
export type NewAutoModConfigRow = typeof autoModConfig.$inferInsert;
