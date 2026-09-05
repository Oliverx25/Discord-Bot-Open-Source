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
    /** JSON: VoiceRoomActionMap */
    allowedActions: text().notNull().default("{}"),
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
