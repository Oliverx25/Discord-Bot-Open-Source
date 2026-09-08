import "dotenv/config";
import { REST, Routes } from "discord.js";
import { DEX_SLASH_COMMANDS } from "../shared/slashCatalog.js";

async function main(): Promise<void> {
  const token = process.env.DISCORD_TOKEN?.trim();
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();

  if (!token || !clientId) {
    throw new Error("Faltan DISCORD_TOKEN y/o DISCORD_CLIENT_ID en .env");
  }

  const rest = new REST({ version: "10" }).setToken(token);
  const body = DEX_SLASH_COMMANDS;

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body,
    });
    console.log(
      `[dex-bot] ${body.length} slash commands registrados en guild ${guildId}`,
    );
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log(
      `[dex-bot] ${body.length} slash commands registrados globalmente`,
    );
  }
}

main().catch((error) => {
  console.error("[dex-bot] Error al registrar comandos:", error);
  process.exit(1);
});
