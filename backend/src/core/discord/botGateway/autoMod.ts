/** Regla de AutoMod nativo de Discord (resumen para el diffing del sync). */
export interface AutoModRuleSummary {
  id: string;
  name: string;
  enabled: boolean;
  /** `AutoModerationRuleEventType` numérico. */
  eventType: number;
  /** `AutoModerationRuleTriggerType` numérico. */
  triggerType: number;
}

/** Acción de una regla de AutoMod (`type` = `AutoModerationActionType`). */
export interface AutoModRuleAction {
  type: number;
  /** Mensaje custom para `BlockMessage`. */
  customMessage?: string;
}

/** Alta/edición de una regla de AutoMod nativo — datos planos. */
export interface AutoModRuleInput {
  name: string;
  enabled: boolean;
  eventType: number;
  triggerType: number;
  keywordFilter?: string[];
  regexPatterns?: string[];
  mentionTotalLimit?: number;
  mentionRaidProtectionEnabled?: boolean;
  actions: AutoModRuleAction[];
  exemptRoles?: string[];
  exemptChannels?: string[];
  reason?: string;
}

/** AutoMod nativo de Discord (auto-mod). */
export interface AutoModGateway {
  listAutoModRules(guildId: string): Promise<AutoModRuleSummary[]>;
  createAutoModRule(guildId: string, rule: AutoModRuleInput): Promise<void>;
  editAutoModRule(
    guildId: string,
    ruleId: string,
    rule: AutoModRuleInput,
  ): Promise<void>;
  deleteAutoModRule(
    guildId: string,
    ruleId: string,
    reason?: string,
  ): Promise<void>;
}
