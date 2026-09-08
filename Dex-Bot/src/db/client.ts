import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

let db: AppDatabase | null = null;
let sqlite: Database.Database | null = null;

function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL ?? "file:./data/dex.sqlite";
  return raw.startsWith("file:") ? raw.slice("file:".length) : raw;
}

function ensureTables(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_teams (
      user_id TEXT PRIMARY KEY NOT NULL,
      team_data TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );
  `);
}

export function initDatabase(): AppDatabase {
  if (db) return db;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  ensureTables(sqlite);
  db = drizzle(sqlite, { schema });
  console.log(`[dex-bot] SQLite listo en ${dbPath}`);
  return db;
}

export function getDb(): AppDatabase {
  if (!db) {
    throw new Error("Base de datos no inicializada. Llama a initDatabase() primero.");
  }
  return db;
}
