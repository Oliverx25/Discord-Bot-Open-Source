import type { AdobosModule } from "#core/modules/types.js";
import { restorePersistedPresence } from "./discord.js";
import { botProfileRoutes } from "./http/routes.js";

export const botProfileModule: AdobosModule = {
  id: "bot-profile",
  name: "Bot Profile",
  registerHttp(ctx) {
    const routes = botProfileRoutes(ctx.botGateway);
    ctx.route("/api/bot/guild-profile", routes);
    // Alias de compatibilidad con el path anterior.
    ctx.route("/api/bot/profile", routes);
  },
  registerGateway(ctx) {
    const client = ctx.client;
    if (!client) return;
    ctx.once("ready", async () => {
      await restorePersistedPresence(client);
    });
  },
};

export {
  BotProfileError,
  getBotProfile,
  getGuildBotProfile,
  readPersistedPresence,
  restorePersistedPresence,
  updateBotProfile,
  updateGuildBotProfile,
} from "./discord.js";
