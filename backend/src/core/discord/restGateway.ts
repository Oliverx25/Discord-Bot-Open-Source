/**
 * `BotGateway` sin gateway vivo: lecturas por REST con caché read-through
 * (L1 por proceso + L2 Redis vía `CacheStore`) para las lecturas caras y de
 * cambio lento — ver `discordCache.ts`. Miembros/mensajes/bans/audit no se
 * cachean. Las escrituras las hereda de `BaseGateway` (e invalidan las claves
 * relacionadas). Lo usa el rol `api`.
 *
 * Partido en mixins por capacidad bajo `restGateway/` (Fase 7, MAINT-01),
 * a diferencia de `BaseGateway` (mixins independientes), aquí varias
 * capacidades comparten helpers privados — `guildRoles`/`rawMember`/
 * `channelInGuild`/`cached` viven en `restGateway/core.ts`
 * (`RestGatewayCore`, una clase con nombre) y el resto de mixins heredan de
 * ella. `RoleAdminMixin`/`BotProfileMixin` además dependen de `getGuild`
 * (`GuildReadsMixin`) y lo declaran en su propio constraint de tipo — por
 * eso el orden de composición aquí sí importa, a diferencia de BaseGateway.
 */

import type { BotGateway } from "./botGateway.js";
import { AutoModMixin } from "./restGateway/autoMod.js";
import { BotProfileMixin } from "./restGateway/botProfile.js";
import { ChannelsMixin } from "./restGateway/channels.js";
import { RestGatewayCore } from "./restGateway/core.js";
import { GuildReadsMixin } from "./restGateway/guildReads.js";
import { MembersMixin } from "./restGateway/members.js";
import { MessagingMixin } from "./restGateway/messaging.js";
import { ModerationMixin } from "./restGateway/moderation.js";
import { RoleAdminMixin } from "./restGateway/roles.js";

const RestGatewayImpl = BotProfileMixin(
  RoleAdminMixin(
    ModerationMixin(
      AutoModMixin(
        ChannelsMixin(
          MessagingMixin(MembersMixin(GuildReadsMixin(RestGatewayCore))),
        ),
      ),
    ),
  ),
);

export class RestGateway extends RestGatewayImpl implements BotGateway {}
