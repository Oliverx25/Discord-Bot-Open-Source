import "dotenv/config";
import { initDatabase } from "./db/client.js";
import { createDexClient } from "./bot/client.js";

async function main(): Promise<void> {
  const token = process.env.DISCORD_TOKEN?.trim();
  if (!token) {
    throw new Error("Falta DISCORD_TOKEN en .env");
  }

  initDatabase();
  const client = createDexClient();
  await client.login(token);
}

main().catch((error) => {
  console.error("[dex-bot] Arranque fallido:", error);
  process.exit(1);
});
