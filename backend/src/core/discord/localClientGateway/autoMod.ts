import type { Constructor } from "../baseGateway/core.js";
import type { AutoModRuleSummary } from "../botGateway.js";
import type { LocalClientGatewayCore } from "./core.js";

/** Lectura de reglas de AutoMod nativo sobre el `Client` vivo. */
export function AutoModMixin<TBase extends Constructor<LocalClientGatewayCore>>(
  Base: TBase,
) {
  return class extends Base {
    async listAutoModRules(guildId: string): Promise<AutoModRuleSummary[]> {
      const guild = this.guild(guildId);
      if (!guild) return [];
      const rules = await guild.autoModerationRules.fetch();
      return [...rules.values()].map((rule) => ({
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled,
        eventType: rule.eventType,
        triggerType: rule.triggerType,
      }));
    }
  };
}
