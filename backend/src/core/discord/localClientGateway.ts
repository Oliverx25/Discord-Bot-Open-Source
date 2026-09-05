/**
 * Adaptador de `BotGateway` sobre el `Client` vivo de discord.js.
 * Lo usa el rol `gateway`, que sí tiene gateway conectado. Comportamiento
 * idéntico al acceso directo previo (`bot.guilds.cache`…).
 *
 * Partido en mixins por capacidad bajo `localClientGateway/` (Fase 7,
 * MAINT-01), con la misma estructura que `restGateway/`: el `Client` +
 * `guild()` (helper compartido por casi todas las capacidades) viven en
 * `localClientGateway/core.ts` (`LocalClientGatewayCore`, una clase con
 * nombre); el resto de mixins heredan de ella. Sin dependencias cruzadas
 * entre mixins más allá de eso (a diferencia de `restGateway/`, donde
 * `RoleAdminMixin`/`BotProfileMixin` dependen de `getGuild`), así que el
 * orden de composición no importa aquí.
 */

import type { BotGateway } from "./botGateway.js";
import { AutoModMixin } from "./localClientGateway/autoMod.js";
import { BotProfileMixin } from "./localClientGateway/botProfile.js";
import { ChannelsMixin } from "./localClientGateway/channels.js";
import { LocalClientGatewayCore } from "./localClientGateway/core.js";
import { GuildReadsMixin } from "./localClientGateway/guildReads.js";
import { MembersMixin } from "./localClientGateway/members.js";
import { MessagingMixin } from "./localClientGateway/messaging.js";
import { ModerationMixin } from "./localClientGateway/moderation.js";
import { RoleAdminMixin } from "./localClientGateway/roles.js";

const LocalClientGatewayImpl = AutoModMixin(
  BotProfileMixin(
    ChannelsMixin(
      MessagingMixin(
        ModerationMixin(
          RoleAdminMixin(MembersMixin(GuildReadsMixin(LocalClientGatewayCore))),
        ),
      ),
    ),
  ),
);

export class LocalClientGateway
  extends LocalClientGatewayImpl
  implements BotGateway {}
