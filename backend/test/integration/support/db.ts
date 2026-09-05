/**
 * Conexión Postgres real para tests de integración. Por defecto apunta al
 * Postgres de `docker compose up` (dev, puerto publicado al host) — el mismo
 * que ya corre migrado si el stack de desarrollo está levantado. Sobreescribe
 * con `DATABASE_URL` para apuntar a otra base descartable.
 */
process.env.DATABASE_URL ??=
  "postgresql://adobos:adobos@127.0.0.1:5432/adobos";
process.env.ADOBO_ROLE ??= "api";
// `encryptSecret`/`decryptSecret` (sessionStore.ts) lo exigen — cualquier
// valor de ≥16 chars sirve para un runner de tests descartable.
process.env.SESSION_SECRET ??= "test-session-secret-not-for-prod";

export async function connectTestDb() {
  const { connectDatabase, migrateDatabase } = await import("#db/client.js");
  // A diferencia de un proceso de aplicación, el runner de tests no tiene un
  // `migrate` one-shot delante — aplica migraciones pendientes él mismo.
  await migrateDatabase();
  return connectDatabase();
}

export async function closeTestDb(): Promise<void> {
  const { closeDatabase } = await import("#db/client.js");
  await closeDatabase();
}
