import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { guildSettings } from "./core.js";

/**
 * TEN-01 (PLAN_FINAL_2026.md, §12.4): antes un upload no tenía dueño — vivía
 * en una carpeta plana (`uploads/backgrounds/<archivo>`) servida por
 * `express.static` detrás de solo `requireAuth()`, así que cualquier usuario
 * logueado al panel (de cualquier guild) podía leer el upload de cualquier
 * otro guild adivinando/enumerando el nombre. Esta fila es la fuente de
 * verdad de a qué guild pertenece cada archivo — la ruta en disco ahora
 * incluye el guildId (`uploads/<kind>/<guildId>/<archivo>`) y servirlo exige
 * `requireGuildAccess()` sobre ESE guildId, no solo sesión válida.
 */
export const uploadedAssets = pgTable(
  "uploaded_assets",
  {
    id: text().primaryKey(),
    guildId: text()
      .notNull()
      .references(() => guildSettings.guildId, { onDelete: "cascade" }),
    ownerId: text().notNull(),
    /** "backgrounds" | "images" — coincide con el segmento de carpeta. */
    kind: text().notNull(),
    filename: text().notNull(),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    sha256: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("uploaded_assets_guild_idx").on(table.guildId)],
);

export type UploadedAssetRow = typeof uploadedAssets.$inferSelect;
