/**
 * Puerto entre el panel HTTP y Discord. Las rutas hablan con este contrato en
 * vez de con el `Client` de discord.js, para que el rol `api` pueda servir sin
 * un gateway vivo (adaptador REST) mientras `gateway` usa el Client
 * (`LocalClientGateway`). Devuelve **datos planos** — ningún tipo discord.js
 * cruza la frontera.
 *
 * Cubre lecturas y escrituras. Las escrituras son una única implementación REST
 * en `BaseGateway` (heredada por ambos adaptadores); las lecturas las resuelve
 * cada adaptador a su manera (caché del Client vivo / REST + Redis).
 *
 * El contrato está partido por capacidad en `botGateway/*` (Fase 7,
 * MAINT-01) para que un módulo nuevo pueda depender de un puerto pequeño
 * (p. ej. solo `MessagingGateway`) en vez de la unión completa. Este archivo
 * sigue siendo el punto de entrada público — reexporta todo y compone
 * `BotGateway` — así ningún importador existente cambia.
 */

export * from "./botGateway/autoMod.js";
export * from "./botGateway/botProfile.js";
export * from "./botGateway/channels.js";
export * from "./botGateway/errors.js";
export * from "./botGateway/guildReads.js";
export * from "./botGateway/members.js";
export * from "./botGateway/messaging.js";
export * from "./botGateway/moderation.js";
export * from "./botGateway/roles.js";
export * from "./botGateway/webhooks.js";

import type { AutoModGateway } from "./botGateway/autoMod.js";
import type { BotProfileGateway } from "./botGateway/botProfile.js";
import type { ChannelsGateway } from "./botGateway/channels.js";
import type { GuildReadsGateway } from "./botGateway/guildReads.js";
import type { MembersGateway } from "./botGateway/members.js";
import type { MessagingGateway } from "./botGateway/messaging.js";
import type { ModerationGateway } from "./botGateway/moderation.js";
import type { RoleAdminGateway } from "./botGateway/roles.js";
import type { WebhooksGateway } from "./botGateway/webhooks.js";

export interface BotGateway
  extends GuildReadsGateway,
    MembersGateway,
    MessagingGateway,
    RoleAdminGateway,
    WebhooksGateway,
    ModerationGateway,
    ChannelsGateway,
    AutoModGateway,
    BotProfileGateway {
  /** El gateway/Client está conectado. El adaptador REST devuelve siempre true. */
  isReady(): boolean;
}
