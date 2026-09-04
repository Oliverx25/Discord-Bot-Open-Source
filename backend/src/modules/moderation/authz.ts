import type { ModActionRequest, ModActionType } from "@adobos/shared";
import type { StoredSession } from "#core/auth/types.js";
import {
  actorGuildAuthority,
  assertActorOutranksMember,
  authorityHasCapability,
  type GuildCapability,
  logCapabilityDenied,
} from "#core/authz/guildPolicy.js";
import type { BotGateway } from "#core/discord/botGateway.js";
import { HttpError } from "#core/http/httpError.js";

/**
 * SEC-01: `requireGuildAccess` solo exige `ManageGuild`. Antes de ejecutar
 * `executeModAction` (que actúa con la autoridad completa del bot) esto valida
 * el permiso Discord específico de la acción y, cuando hay un miembro
 * objetivo, que el actor lo supere en jerarquía de roles — además de la
 * jerarquía bot–objetivo que ya valida `assertBotCanAct` en `discord.ts`.
 */
const ACTION_CAPABILITY: Record<ModActionType, GuildCapability> = {
  warn: "moderation.warn",
  clearwarns: "moderation.warn",
  kick: "moderation.kick",
  ban: "moderation.ban",
  unban: "moderation.ban",
  timeout: "moderation.timeout",
  untimeout: "moderation.timeout",
  purge: "moderation.purge",
  slowmode: "channels.write",
  lock: "channels.write",
  unlock: "channels.write",
};

const MEMBER_TARGETED_ACTIONS = new Set<ModActionType>([
  "warn",
  "kick",
  "ban",
  "unban",
  "timeout",
  "untimeout",
  "clearwarns",
]);

export async function assertModActionAuthorized(
  gateway: BotGateway,
  session: StoredSession,
  guildId: string,
  input: Pick<ModActionRequest, "action" | "userId">,
): Promise<void> {
  const capability = ACTION_CAPABILITY[input.action];
  const authority = await actorGuildAuthority(session, guildId);
  if (!authority || !authorityHasCapability(authority, capability)) {
    logCapabilityDenied({
      guildId,
      actorUserId: session.userId,
      capability,
      reason: "missing_capability",
    });
    throw new HttpError(
      `You don't have the required Discord permission for this action (${capability}).`,
      403,
      "CAPABILITY_DENIED",
    );
  }

  if (MEMBER_TARGETED_ACTIONS.has(input.action) && input.userId) {
    const hierarchy = await assertActorOutranksMember(
      gateway,
      authority,
      guildId,
      session.userId,
      input.userId,
    );
    if (!hierarchy.ok) {
      logCapabilityDenied({
        guildId,
        actorUserId: session.userId,
        capability,
        reason: "hierarchy",
      });
      throw new HttpError(hierarchy.reason, 403, "HIERARCHY_DENIED");
    }
  }
}
