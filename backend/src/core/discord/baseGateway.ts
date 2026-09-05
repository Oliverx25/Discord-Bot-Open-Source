/**
 * Base común de los adaptadores de `BotGateway`.
 *
 * Aquí viven las **escrituras** — que son la misma llamada REST por token
 * tanto si hay gateway vivo (`LocalClientGateway`) como si no (`RestGateway`).
 * Se implementan **una sola vez**. Las lecturas las resuelve cada subclase a
 * su manera (caché del Client / REST + Redis).
 *
 * Partido en mixins por capacidad bajo `baseGateway/` (Fase 7, MAINT-01),
 * con los mismos nombres de capacidad que `botGateway/` — cada mixin solo
 * depende de `RestClientCore` (el cliente REST por token, memoizado) y no
 * de los demás, así que el orden de composición no importa. Este archivo
 * sigue siendo el punto de entrada público: `BaseGateway` es la clase
 * concreta que resulta de mezclar las 8 capacidades.
 */

import { AutoModMixin } from "./baseGateway/autoMod.js";
import { BotProfileMixin } from "./baseGateway/botProfile.js";
import { ChannelsMixin } from "./baseGateway/channels.js";
import { RestClientCore } from "./baseGateway/core.js";
import { GuildReadsMixin } from "./baseGateway/guildReads.js";
import { MessagingMixin } from "./baseGateway/messaging.js";
import { ModerationMixin } from "./baseGateway/moderation.js";
import { RoleAdminMixin } from "./baseGateway/roles.js";
import { WebhooksMixin } from "./baseGateway/webhooks.js";

const BaseGatewayImpl = AutoModMixin(
  BotProfileMixin(
    ChannelsMixin(
      GuildReadsMixin(
        MessagingMixin(
          ModerationMixin(RoleAdminMixin(WebhooksMixin(RestClientCore))),
        ),
      ),
    ),
  ),
);

export abstract class BaseGateway extends BaseGatewayImpl {}
