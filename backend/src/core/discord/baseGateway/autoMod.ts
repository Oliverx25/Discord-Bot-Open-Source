import { Routes } from "discord.js";
import type { AutoModRuleInput } from "../botGateway.js";
import type { Constructor, RestClientCore } from "./core.js";

function autoModBody(rule: AutoModRuleInput): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (rule.keywordFilter !== undefined)
    meta.keyword_filter = rule.keywordFilter;
  if (rule.regexPatterns !== undefined)
    meta.regex_patterns = rule.regexPatterns;
  if (rule.mentionTotalLimit !== undefined) {
    meta.mention_total_limit = rule.mentionTotalLimit;
  }
  if (rule.mentionRaidProtectionEnabled !== undefined) {
    meta.mention_raid_protection_enabled = rule.mentionRaidProtectionEnabled;
  }
  return {
    name: rule.name,
    enabled: rule.enabled,
    event_type: rule.eventType,
    trigger_metadata: meta,
    actions: rule.actions.map((action) => ({
      type: action.type,
      metadata: action.customMessage
        ? { custom_message: action.customMessage }
        : undefined,
    })),
    exempt_roles: rule.exemptRoles ?? [],
    exempt_channels: rule.exemptChannels ?? [],
  };
}

/** AutoMod nativo de Discord (auto-mod) — implementación REST compartida. */
export function AutoModMixin<TBase extends Constructor<RestClientCore>>(
  Base: TBase,
) {
  return class extends Base {
    async createAutoModRule(
      guildId: string,
      rule: AutoModRuleInput,
    ): Promise<void> {
      await this.restClient().post(Routes.guildAutoModerationRules(guildId), {
        body: { ...autoModBody(rule), trigger_type: rule.triggerType },
        reason: rule.reason,
      });
    }

    async editAutoModRule(
      guildId: string,
      ruleId: string,
      rule: AutoModRuleInput,
    ): Promise<void> {
      await this.restClient().patch(
        Routes.guildAutoModerationRule(guildId, ruleId),
        { body: autoModBody(rule), reason: rule.reason },
      );
    }

    async deleteAutoModRule(
      guildId: string,
      ruleId: string,
      reason?: string,
    ): Promise<void> {
      await this.restClient().delete(
        Routes.guildAutoModerationRule(guildId, ruleId),
        { reason },
      );
    }
  };
}
