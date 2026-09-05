import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { logger } from "#core/log.js";
import { runtimeRole } from "#core/runtime/index.js";
import * as schema from "./schema.js";

/**
 * Tamaño de pool por rol. Con N réplicas del rol `api` cada una abre su pool
 * contra el mismo Postgres, así que el `api` es más pequeño por réplica.
 * `DB_POOL_MAX` lo sobreescribe.
 */
function poolMax(): number {
  const override = Number(process.env.DB_POOL_MAX);
  if (Number.isInteger(override) && override > 0) return override;
  switch (runtimeRole()) {
    case "api":
      return 8;
    case "gateway":
    case "worker":
      return 6;
    default:
      // Defensivo: los tres `AdobosRole` están cubiertos arriba; no hay rol `all`.
      return 6;
  }
}

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

let db: AppDatabase | null = null;
let sql: ReturnType<typeof postgres> | null = null;

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw || raw.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL must be postgresql://… (Phase 2.11). SQLite is no longer supported.",
    );
  }
  return raw;
}

function migrationsFolder(): string {
  return path.resolve(import.meta.dirname, "../../drizzle");
}

/**
 * Código de error de red, desenvolviendo la cadena `cause`.
 * drizzle-orm ≥0.39 envuelve los fallos en `DrizzleQueryError`, así que el
 * `ECONNREFUSED`/`ENOTFOUND` real vive en `error.cause` (o más abajo).
 */
function errorCode(error: unknown): string {
  let cursor: unknown = error;
  for (
    let depth = 0;
    cursor && typeof cursor === "object" && depth < 5;
    depth++
  ) {
    const code = (cursor as { code?: unknown }).code;
    if (typeof code === "string" && code) return code;
    cursor = (cursor as { cause?: unknown }).cause;
  }
  return "";
}

/** Reintenta mientras Postgres todavía no acepta conexiones (arranque del contenedor). */
async function withPgRetry<T>(action: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      return await action();
    } catch (error: unknown) {
      const code = errorCode(error);
      const retryable =
        code === "EAI_AGAIN" ||
        code === "ECONNREFUSED" ||
        code === "ENOTFOUND" ||
        code === "ETIMEDOUT" ||
        code === "CONNECT_TIMEOUT";
      if (!retryable || attempt === 8) throw error;
      const delay = Math.min(500 * 2 ** (attempt - 1), 5000);
      logger.warn(
        { err: error, code },
        `Postgres no alcanzable; reintento ${attempt}/8 en ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Could not connect to Postgres.");
}

/**
 * OPS-01 (PLAN_FINAL_2026.md): antes `initDatabase()` migraba Y conectaba en
 * un único paso, y lo llamaban los tres roles de aplicación en cada arranque
 * (incluido cada restart de hot reload en dev). Sin lock alguno —
 * `PgDialect.migrate` no toma ningún advisory lock ni constraint que lo
 * evite— dos procesos migrando a la vez pueden pisarse (DDL duplicado,
 * filas de `__drizzle_migrations` repetidas, o un `ALTER TABLE` que revienta
 * en el segundo proceso y tumba ese boot). `migrateDatabase()` corre
 * exclusivamente en el servicio one-shot `migrate`; los tres procesos de
 * aplicación solo llaman `connectDatabase()`, que jamás toca el esquema.
 */
export async function migrateDatabase(): Promise<void> {
  const url = resolveDatabaseUrl();
  const folder = migrationsFolder();
  await withPgRetry(async () => {
    const migrationClient = postgres(url, { max: 1, connect_timeout: 10 });
    try {
      await migrate(
        drizzle(migrationClient, { schema, casing: "snake_case" }),
        { migrationsFolder: folder },
      );
    } finally {
      await migrationClient.end({ timeout: 5 }).catch(() => undefined);
    }
  });
}

/** Conecta a Postgres y deja el pool listo. Nunca aplica migraciones. */
export async function connectDatabase(): Promise<AppDatabase> {
  if (db) return db;
  const url = resolveDatabaseUrl();
  const max = poolMax();

  return withPgRetry(async () => {
    const client = postgres(url, {
      max,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
      connection: {
        // Una query que se descontrola muere sola (ms) en vez de retener
        // una conexión del pool indefinidamente.
        statement_timeout: 15_000,
        idle_in_transaction_session_timeout: 30_000,
        application_name: `adobos-${runtimeRole()}`,
      },
    });
    try {
      await client`SELECT 1`;
    } catch (error: unknown) {
      await client.end({ timeout: 2 }).catch(() => undefined);
      throw error;
    }
    sql = client;
    db = drizzle(sql, { schema, casing: "snake_case" });
    logger.info({ poolMax: max, role: runtimeRole() }, "Postgres listo");
    return db;
  });
}

export function getDb(): AppDatabase {
  if (!db) {
    throw new Error("Database not initialized. Call connectDatabase() first.");
  }
  return db;
}

export async function pingDatabase(): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export interface PoolStateCount {
  state: string;
  count: number;
}

/**
 * Fase 8 (métricas): conexiones reales vistas por Postgres para el
 * `application_name` de este proceso (`adobos-<role>`, seteado en
 * `connectDatabase()`). `postgres` (porsager) no expone contadores de pool
 * en su API pública (`open`/`busy`/`full`/etc. son closures internas del
 * módulo) — `pg_stat_activity` da el mismo dato, y de la fuente de verdad
 * real (el propio servidor), sin depender de internals de la librería.
 */
export async function poolStats(): Promise<PoolStateCount[]> {
  if (!sql) return [];
  const rows = await sql<{ state: string | null; count: string }[]>`
    SELECT state, count(*)::text AS count
    FROM pg_stat_activity
    WHERE application_name = ${`adobos-${runtimeRole()}`}
    GROUP BY state
  `;
  return rows.map((r) => ({
    state: r.state ?? "unknown",
    count: Number(r.count),
  }));
}

export async function closeDatabase(): Promise<void> {
  if (sql) {
    await sql.end({ timeout: 5 }).catch(() => undefined);
  }
  sql = null;
  db = null;
}

export async function one<T>(rows: Promise<T[]>): Promise<T | undefined> {
  const [row] = await rows;
  return row;
}
