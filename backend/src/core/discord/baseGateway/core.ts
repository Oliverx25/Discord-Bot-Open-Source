import type { REST } from "@discordjs/rest";
import { cache } from "#core/cache/store.js";
import { env } from "#core/env.js";
import { BotGatewayError } from "../botGateway.js";
import { getDiscordRest } from "../rest.js";

/**
 * Tipo constructor genérico para el patrón mixin de TS. El compilador exige
 * literalmente `any[]` para la clase base de un mixin (TS2545) — no acepta
 * `unknown[]` ni un genérico.
 */
export type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Invalida claves de la caché read-through de `RestGateway`. Fire-and-forget:
 * un fallo de caché no debe romper la escritura. `RedisStore.del` propaga la
 * invalidación por pub/sub a las demás réplicas `api`.
 */
export function bustDiscordCache(...keys: string[]): void {
  for (const key of keys) {
    void cache()
      .del(key)
      .catch(() => undefined);
  }
}

/**
 * Raíz de la cadena de mixins de `BaseGateway`: el cliente REST por token,
 * memoizado. Cada capacidad (channels, messaging, roles...) se mezcla sobre
 * esta clase y llama `this.restClient()`.
 */
export class RestClientCore {
  #rest: REST | null = null;

  /**
   * Público (no `protected`): con `declaration: true`, TS no puede expresar
   * miembros `protected`/`private` (keyword) en el tipo anónimo que devuelve
   * cada mixin (TS4094). El campo real sigue oculto vía `#rest` (private
   * field de ECMAScript, invisible incluso en runtime) — solo el acceso de
   * lectura queda público.
   */
  restClient(): REST {
    if (!this.#rest) {
      const token = env().DISCORD_TOKEN?.trim();
      if (!token) {
        throw new BotGatewayError(
          "No Discord token configured for REST operations.",
          503,
          "NO_DISCORD_TOKEN",
        );
      }
      this.#rest = getDiscordRest(token);
    }
    return this.#rest;
  }
}
