import {
  boolean,
  integer,
  jsonb,
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
  /** Documento tipado (Fase 7, MAINT-01): antes JSON como text(). */
  filters: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  /** string[] role IDs. */
  ignoredRoles: jsonb().$type<string[]>().notNull().default([]),
  /** string[] channel IDs. */
  ignoredChannels: jsonb().$type<string[]>().notNull().default([]),
  logChannelId: text(),
  /** Días para caducidad de Warns activos; 0 = nunca. */
  warnDecayDays: integer().notNull().default(30),
  /** Registrar warn en cada hit de filtro (default: sí, comportamiento histórico). */
  warnOnHit: boolean().notNull().default(true),
  /** DM al usuario junto al warn. Ignorado si warnOnHit es false. */
  dmOnHit: boolean().notNull().default(true),
  /** Saltar Administrator / ManageMessages. */
  skipStaff: boolean().notNull().default(false),
  /** AutoModPunishment[] — documento tipado. */
  punishments: jsonb().$type<unknown[]>().notNull().default([]),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AutoModConfigRow = typeof autoModConfig.$inferSelect;
export type NewAutoModConfigRow = typeof autoModConfig.$inferInsert;
