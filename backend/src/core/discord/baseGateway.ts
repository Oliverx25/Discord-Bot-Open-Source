import type { REST } from "@discordjs/rest";
import { env } from "#core/env.js";
import { BotGatewayError } from "./botGateway.js";
import { getDiscordRest } from "./rest.js";

/**
 * Base común de los adaptadores de `BotGateway`.
 *
 * Aquí viven (a partir de la wave 15) las **escrituras** — que son la misma
 * llamada REST por token tanto si hay gateway vivo (`LocalClientGateway`) como
 * si no (`RestGateway`). Se implementan **una sola vez**. Las lecturas las
 * resuelve cada subclase a su manera (caché del Client / REST + Redis).
 */
export abstract class BaseGateway {
  private rest: REST | null = null;

  /** Cliente REST por token. Lanza si no hay `DISCORD_TOKEN`. */
  protected restClient(): REST {
    if (!this.rest) {
      const token = env().DISCORD_TOKEN?.trim();
      if (!token) {
        throw new BotGatewayError(
          "No Discord token configured for REST operations.",
          503,
          "NO_DISCORD_TOKEN",
        );
      }
      this.rest = getDiscordRest(token);
    }
    return this.rest;
  }
}
