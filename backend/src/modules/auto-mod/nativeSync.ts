import type { AutoModConfig, AutoModFilterKey } from "@adobos/shared";
import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  DiscordAPIError,
  PermissionFlagsBits,
} from "discord.js";
import type {
  AutoModRuleAction,
  AutoModRuleInput,
  AutoModRuleSummary,
  BotGateway,
} from "#core/discord/botGateway.js";
import { logger } from "#core/log.js";
import {
  ADOBOS_NATIVE_RULE_NAMES,
  ADOBOS_NATIVE_RULE_PREFIX,
  DISCORD_EXEMPT_CHANNELS_MAX,
  DISCORD_EXEMPT_ROLES_MAX,
  discordInviteRegexPatterns,
  nativeRuleKeyFromName,
  sliceExemptIds,
  toDiscordKeywordFilter,
} from "./nativeRules.js";

export interface NativeSyncResult {
  ok: boolean;
  message: string;
}

const AUDIT = "Adobos Auto-Mod";
const BLOCK_MESSAGE = "Your message was blocked by Auto-Mod (Adobos).";

/**
 * Espeja palabras / invitaciones / menciones en AutoMod nativo de Discord.
 * El mensaje no llega al canal. Zalgo, caps y flood siguen en el bot.
 * No toca reglas que no empiecen por "Adobos · ".
 */
export async function syncNativeAutoMod(
  gateway: BotGateway,
  guildId: string,
  config: AutoModConfig,
): Promise<NativeSyncResult> {
  const guild = await gateway.getGuild(guildId);
  if (!guild) {
    return {
      ok: false,
      message:
        "The bot is not in that server; native AutoMod couldn't be synced.",
    };
  }

  const canManage = await gateway.botHasGuildPermission(
    guildId,
    PermissionFlagsBits.ManageGuild,
  );
  if (!canManage) {
    return {
      ok: false,
      message:
        "Missing the Manage Server permission to sync native AutoMod. The bot filter is still active.",
    };
  }

  try {
    const existing = await gateway.listAutoModRules(guildId);
    const ours = existing.filter((rule) =>
      rule.name.startsWith(ADOBOS_NATIVE_RULE_PREFIX),
    );
    // Key by filter, not by raw name, so rules still carrying a pre-1c-B
    // Spanish name are adopted and get renamed in place by the upsert.
    const byKey = new Map<AutoModFilterKey, AutoModRuleSummary>();
    for (const rule of ours) {
      const key = nativeRuleKeyFromName(rule.name);
      if (!key) continue;
      // A rule already under the canonical English name always wins over a
      // leftover Spanish-named one for the same filter.
      const canonicalName =
        ADOBOS_NATIVE_RULE_NAMES[key as keyof typeof ADOBOS_NATIVE_RULE_NAMES];
      if (canonicalName === rule.name || !byKey.has(key)) byKey.set(key, rule);
    }
    const exemptRoles = sliceExemptIds(
      config.ignoredRoles,
      DISCORD_EXEMPT_ROLES_MAX,
    );
    const exemptChannels = sliceExemptIds(
      config.ignoredChannels,
      DISCORD_EXEMPT_CHANNELS_MAX,
    );

    const words = toDiscordKeywordFilter(
      config.enabled && config.filters.bannedWordsEnabled
        ? config.filters.bannedWords
        : [],
    );
    await upsertKeywordRule(gateway, guildId, byKey.get("bannedWords"), {
      name: ADOBOS_NATIVE_RULE_NAMES.bannedWords,
      enabled: words.length > 0,
      keywordFilter: words,
      exemptRoles,
      exemptChannels,
    });

    await upsertInviteRule(gateway, guildId, byKey.get("antiInvites"), {
      enabled: Boolean(config.enabled && config.filters.antiInvites),
      exemptRoles,
      exemptChannels,
    });

    await upsertMentionRule(gateway, guildId, byKey.get("mentionSpam"), {
      enabled: Boolean(config.enabled && config.filters.mentionSpam),
      mentionTotalLimit: config.filters.mentionSpamLimit,
      exemptRoles,
      exemptChannels,
    });

    return { ok: true, message: "Discord native AutoMod synced." };
  } catch (error) {
    if (
      error instanceof DiscordAPIError &&
      (error.code === 50013 || error.status === 403)
    ) {
      return {
        ok: false,
        message:
          "Discord rejected the native rules (permissions or the server's rule cap). The bot filter is still active.",
      };
    }
    logger.warn({ err: error, guildId }, "auto-mod: native sync failed:");
    return {
      ok: false,
      message: "Couldn't sync native AutoMod. The bot filter is still active.",
    };
  }
}

function blockAction(): AutoModRuleAction[] {
  return [
    {
      type: AutoModerationActionType.BlockMessage,
      customMessage: BLOCK_MESSAGE,
    },
  ];
}

/** ¿Se puede editar en sitio o hay que recrear por cambio de `triggerType`? */
async function upsert(
  gateway: BotGateway,
  guildId: string,
  existing: AutoModRuleSummary | undefined,
  rule: AutoModRuleInput,
): Promise<void> {
  if (existing && existing.triggerType === rule.triggerType) {
    await gateway.editAutoModRule(guildId, existing.id, rule);
    return;
  }
  if (existing) await gateway.deleteAutoModRule(guildId, existing.id, AUDIT);
  await gateway.createAutoModRule(guildId, rule);
}

async function upsertKeywordRule(
  gateway: BotGateway,
  guildId: string,
  existing: AutoModRuleSummary | undefined,
  input: {
    name: string;
    enabled: boolean;
    keywordFilter: string[];
    exemptRoles: string[];
    exemptChannels: string[];
  },
): Promise<void> {
  if (!input.enabled) {
    if (existing) await gateway.deleteAutoModRule(guildId, existing.id, AUDIT);
    return;
  }
  await upsert(gateway, guildId, existing, {
    name: input.name,
    enabled: true,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Keyword,
    keywordFilter: input.keywordFilter,
    actions: blockAction(),
    exemptRoles: input.exemptRoles,
    exemptChannels: input.exemptChannels,
    reason: AUDIT,
  });
}

async function upsertInviteRule(
  gateway: BotGateway,
  guildId: string,
  existing: AutoModRuleSummary | undefined,
  input: {
    enabled: boolean;
    exemptRoles: string[];
    exemptChannels: string[];
  },
): Promise<void> {
  if (!input.enabled) {
    if (existing) await gateway.deleteAutoModRule(guildId, existing.id, AUDIT);
    return;
  }
  await upsert(gateway, guildId, existing, {
    name: ADOBOS_NATIVE_RULE_NAMES.antiInvites,
    enabled: true,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Keyword,
    keywordFilter: [],
    regexPatterns: discordInviteRegexPatterns(),
    actions: blockAction(),
    exemptRoles: input.exemptRoles,
    exemptChannels: input.exemptChannels,
    reason: AUDIT,
  });
}

async function upsertMentionRule(
  gateway: BotGateway,
  guildId: string,
  existing: AutoModRuleSummary | undefined,
  input: {
    enabled: boolean;
    mentionTotalLimit: number;
    exemptRoles: string[];
    exemptChannels: string[];
  },
): Promise<void> {
  if (!input.enabled) {
    if (existing) await gateway.deleteAutoModRule(guildId, existing.id, AUDIT);
    return;
  }
  const limit = Math.max(
    1,
    Math.min(50, Math.round(input.mentionTotalLimit || 5)),
  );
  await upsert(gateway, guildId, existing, {
    name: ADOBOS_NATIVE_RULE_NAMES.mentionSpam,
    enabled: true,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.MentionSpam,
    mentionTotalLimit: limit,
    mentionRaidProtectionEnabled: true,
    actions: blockAction(),
    exemptRoles: input.exemptRoles,
    exemptChannels: input.exemptChannels,
    reason: AUDIT,
  });
}
