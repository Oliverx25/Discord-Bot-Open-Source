import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Liderazgo del worker (OPS-01/12.2). Lease renovable con expiración y
 * fencing token — reemplaza el advisory lock de sesión, que perdía el
 * liderazgo en silencio ante un reconnect transparente de postgres.js sin
 * revocar el booleano en memoria del proceso. `expiresAt < now()` = libre
 * para que otra réplica la reclame; `fencingToken` sube en cada cambio de
 * dueño (nunca en una simple renovación) para que un consumidor aguas abajo
 * pueda rechazar una escritura de un ex-líder que despertó tarde.
 */
export const workerLeases = pgTable("worker_leases", {
  name: text().primaryKey(),
  holder: text().notNull(),
  fencingToken: integer().notNull().default(0),
  expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
});

export type WorkerLeaseRow = typeof workerLeases.$inferSelect;
