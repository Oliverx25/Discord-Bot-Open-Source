import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Forma de `allowedActions` a nivel de fila. No importa `VoiceRoomActionMap`
 * de `@adobos/shared` a propósito: drizzle-kit resuelve `schema.ts` con su
 * propio bundler CJS y no sigue el `exports` map condicional del paquete
 * (falla con `ERR_PACKAGE_PATH_NOT_EXPORTED`) — ningún otro archivo de
 * `db/schema/` depende de `shared`. El dominio (`normalizeVoiceRoomActions`)
 * sigue siendo la única fuente de verdad sobre qué claves son válidas.
 */
type VoiceRoomActionMapRow = Record<string, boolean>;

/**
 * Generadores Join to Create (Voice Rooms).
 */
export const voiceRoomGenerators = pgTable(
  "voice_room_generators",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    hubChannelId: text().notNull(),
    categoryId: text(),
    nameTemplate: text().notNull().default("{user}'s room"),
    defaultUserLimit: integer().notNull().default(0),
    defaultBitrate: integer().notNull().default(0),
    autoText: boolean().notNull().default(false),
    enabled: boolean().notNull().default(true),
    /**
     * Documento tipado (Fase 7, MAINT-01): antes `text()` con JSON manual
     * (`JSON.parse`/`JSON.stringify` en el dominio). Postgres valida que sea
     * JSON válido y lo entrega ya parseado — el dominio sigue pasándolo por
     * `normalizeVoiceRoomActions()` como guarda de forma en runtime (TS no
     * protege contra filas escritas antes de esta migración).
     */
    allowedActions: jsonb()
      .$type<VoiceRoomActionMapRow>()
      .notNull()
      .default({}),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("voice_room_generators_guild_hub").on(
      table.guildId,
      table.hubChannelId,
    ),
  ],
);

/**
 * Salas temporales vivas. channel_id = VC de Discord.
 */
export const voiceRooms = pgTable(
  "voice_rooms",
  {
    channelId: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    generatorId: integer()
      .notNull()
      .references(() => voiceRoomGenerators.id, { onDelete: "cascade" }),
    ownerId: text().notNull(),
    textChannelId: text(),
    locked: boolean().notNull().default(false),
    ghosted: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("voice_rooms_guild_owner").on(table.guildId, table.ownerId),
    index("idx_voice_rooms_guild").on(table.guildId),
  ],
);

export type VoiceRoomGeneratorRow = typeof voiceRoomGenerators.$inferSelect;
export type VoiceRoomRow = typeof voiceRooms.$inferSelect;
