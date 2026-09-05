import { logger } from "#core/log.js";
import { migrateDatabase } from "./client.js";

async function run(): Promise<void> {
  await migrateDatabase();
  logger.info("Migraciones Drizzle aplicadas (Postgres)");
  process.exit(0);
}

run().catch((error: unknown) => {
  logger.error({ err: error }, "Migration failed:");
  process.exit(1);
});
