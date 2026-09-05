import type { Client, Guild } from "discord.js";
import { BaseGateway } from "../baseGateway.js";

/**
 * Núcleo compartido de `LocalClientGateway`: el `Client` vivo de discord.js
 * + `guild()`, que reutilizan prácticamente todas las capacidades (lecturas
 * de guild/canal/rol/emoji, miembros, mensajes, moderación, AutoMod...).
 *
 * Público (no `protected`): igual que `RestGatewayCore`, un mixin que hereda
 * de esta clase y se exporta como clase anónima vuelve a disparar TS4094 en
 * cuanto expone en su superficie un miembro `protected` heredado.
 */
export class LocalClientGatewayCore extends BaseGateway {
  constructor(readonly client: Client) {
    super();
  }

  isReady(): boolean {
    return this.client.isReady();
  }

  guild(guildId: string): Guild | null {
    return this.client.guilds.cache.get(guildId) ?? null;
  }
}
