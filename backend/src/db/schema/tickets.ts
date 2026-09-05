import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * Tickets: ajustes por guild. El canal de Discord es la sala; Postgres es el expediente.
 */
export const ticketSettings = pgTable("ticket_settings", {
  guildId: text()
    .primaryKey()
    .references(() => guildSettings.guildId, { onDelete: "cascade" }),
  categoryId: text(),
  /** string[] role IDs — documento tipado. */
  staffRoleIds: jsonb().$type<string[]>().notNull().default([]),
  nameTemplate: text().notNull().default("ticket-{n}-{user}"),
  maxOpenPerUser: integer().notNull().default(1),
  logChannelId: text(),
  nextNumber: integer().notNull().default(1),
  openerCanClose: boolean().notNull().default(true),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type TicketSettingsRow = typeof ticketSettings.$inferSelect;

/** Panel publicado (mensaje + hasta 5 botones / tipos). */
export const ticketPanels = pgTable(
  "ticket_panels",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    channelId: text(),
    messageId: text(),
    embedTitle: text().notNull().default("Tickets"),
    embedDescription: text()
      .notNull()
      .default("Press a button to open a ticket."),
    embedColor: text().notNull().default("#5865F2"),
    /** TicketPanelButton[] — documento tipado. */
    buttons: jsonb().$type<unknown[]>().notNull().default([]),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("idx_ticket_panels_guild").on(table.guildId)],
);

export type TicketPanelRow = typeof ticketPanels.$inferSelect;

/** Caso de ticket. channel_id null si el canal ya no existe. */
export const tickets = pgTable(
  "tickets",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    number: integer().notNull(),
    openerId: text().notNull(),
    channelId: text(),
    typeKey: text().notNull(),
    status: text().notNull().default("open"),
    claimedBy: text(),
    reason: text(),
    closeReason: text(),
    transcriptText: text(),
    openedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    closedAt: timestamp({ withTimezone: true, mode: "date" }),
    claimedAt: timestamp({ withTimezone: true, mode: "date" }),
  },
  (table) => [
    uniqueIndex("tickets_guild_number").on(table.guildId, table.number),
    uniqueIndex("tickets_channel_id_unique").on(table.channelId),
    index("idx_tickets_guild_status").on(table.guildId, table.status),
    index("idx_tickets_guild_opener").on(table.guildId, table.openerId),
  ],
);

export type TicketRow = typeof tickets.$inferSelect;

/** Timeline append-only. Nunca update/delete de filas. */
export const ticketEvents = pgTable(
  "ticket_events",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    ticketId: integer()
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    type: text().notNull(),
    actorId: text(),
    /** Contexto libre del evento — documento tipado. */
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_ticket_events_ticket").on(table.ticketId),
    index("idx_ticket_events_guild_created").on(table.guildId, table.createdAt),
  ],
);

export type TicketEventRow = typeof ticketEvents.$inferSelect;

export const ticketParticipants = pgTable(
  "ticket_participants",
  {
    ticketId: integer()
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: text().notNull(),
    kind: text().notNull().default("added"),
  },
  (table) => [
    primaryKey({ columns: [table.ticketId, table.userId] }),
    index("idx_ticket_participants_ticket").on(table.ticketId),
  ],
);

export type TicketParticipantRow = typeof ticketParticipants.$inferSelect;
