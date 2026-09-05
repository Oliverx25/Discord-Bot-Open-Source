import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Usuarios del panel (OAuth Discord). */
export const panelUsers = pgTable("panel_users", {
  userId: text().primaryKey(),
  username: text().notNull(),
  globalName: text(),
  avatar: text(),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Sesiones opacas del panel. */
export const panelSessions = pgTable(
  "panel_sessions",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => panelUsers.userId, { onDelete: "cascade" }),
    accessTokenEnc: text().notNull(),
    refreshTokenEnc: text(),
    accessExpiresAt: timestamp({
      withTimezone: true,
      mode: "date",
    }),
    expiresAt: timestamp({
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("idx_panel_sessions_user").on(table.userId)],
);

/** State OAuth de un solo uso (anti-CSRF + PKCE verifier). */
export const oauthStates = pgTable("oauth_states", {
  state: text().primaryKey(),
  codeVerifier: text().notNull(),
  expiresAt: timestamp({
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
