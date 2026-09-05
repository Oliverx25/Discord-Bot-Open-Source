import { Routes } from "discord.js";
import type { Constructor } from "../baseGateway/core.js";
import type { AutoModRuleSummary } from "../botGateway.js";
import type { RestGatewayCore } from "./core.js";

/** Lectura de reglas de AutoMod nativo vía REST. */
export function AutoModMixin<TBase extends Constructor<RestGatewayCore>>(
  Base: TBase,
) {
  return class extends Base {
    async listAutoModRules(guildId: string): Promise<AutoModRuleSummary[]> {
      const rules = (await this.restClient().get(
        Routes.guildAutoModerationRules(guildId),
      )) as {
        id: string;
        name: string;
        enabled: boolean;
        event_type: number;
        trigger_type: number;
      }[];
      return rules.map((r) => ({
        id: r.id,
        name: r.name,
        enabled: r.enabled,
        eventType: r.event_type,
        triggerType: r.trigger_type,
      }));
    }
  };
}
