import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Equipo Teambuilder persistente por usuario Discord.
 * `team_data`: JSON array de 6 slots `{ species, moves, item } | null`.
 */
export const userTeams = sqliteTable("user_teams", {
  userId: text("user_id").primaryKey(),
  teamData: text("team_data").notNull().default("[]"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type UserTeamsRow = typeof userTeams.$inferSelect;
export type NewUserTeamsRow = typeof userTeams.$inferInsert;
