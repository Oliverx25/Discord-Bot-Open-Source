/**
 * Conexión Postgres real para tests de integración. Por defecto apunta al
 * Postgres de `docker compose up` (dev, puerto publicado al host) — el mismo
 * que ya corre migrado si el stack de desarrollo está levantado. Sobreescribe
 * con `DATABASE_URL` para apuntar a otra base descartable.
 */
process.env.DATABASE_URL ??=
  "postgresql://adobos:adobos@127.0.0.1:5432/adobos";
process.env.ADOBO_ROLE ??= "api";

export async function connectTestDb() {
  const { initDatabase } = await import("#db/client.js");
  return initDatabase();
}

export async function closeTestDb(): Promise<void> {
  const { closeDatabase } = await import("#db/client.js");
  await closeDatabase();
}
