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
 * Tarjeta de bienvenida por servidor (imagen PNG generada).
 */
export const welcomeSettings = pgTable("welcome_settings", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  channelId: text(),
  isEnabled: boolean().notNull().default(false),
  /** Legacy: el módulo siempre opera como canvas (`card`). */
  welcomeMode: text().notNull().default("card"),
  /** URL remota — opcional si hay bg_filepath. */
  backgroundUrl: text(),
  /** Ruta pública local: `/uploads/backgrounds/...` */
  bgFilepath: text(),
  blurAmount: integer().notNull().default(4),
  /**
   * @deprecated Migrado a `textLayers`. Se mantiene para lectura legacy.
   */
  primaryText: text().notNull().default("Welcome!"),
  /**
   * @deprecated Migrado a `textLayers`.
   */
  secondaryText: text().notNull().default("{username}"),
  /** Texto opcional del mensaje Discord (o descripción embed). */
  messageContent: text().notNull().default("{user}"),
  avatarX: integer().notNull().default(960),
  avatarY: integer().notNull().default(380),
  avatarSize: integer().notNull().default(280),
  avatarBorderWidth: integer().notNull().default(8),
  avatarBorderColor: text().notNull().default("#FFFFFF"),
  /**
   * @deprecated Coordenadas legacy; las capas viven en textLayers.
   */
  textX: integer().notNull().default(960),
  textY: integer().notNull().default(560),
  fontSize: integer().notNull().default(64),
  textColor: text().notNull().default("#FFFFFF"),
  /** WelcomeTextLayer[] — documento tipado, nullable (legacy sin migrar). */
  textLayers: jsonb().$type<unknown[]>(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type WelcomeSettings = typeof welcomeSettings.$inferSelect;
export type NewWelcomeSettings = typeof welcomeSettings.$inferInsert;
