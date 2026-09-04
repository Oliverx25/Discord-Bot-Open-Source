import { PermissionFlagsBits } from "discord.js";
import { actorManagedGuild } from "../auth/discordGuilds.js";
import type { StoredSession } from "../auth/types.js";
import type { BotGateway, RoleSummary } from "../discord/botGateway.js";
import { logger } from "../log.js";

/**
 * Fase 4 (SEC-01, PLAN_FINAL_2026.md): `requireGuildAccess` solo confirma que
 * el usuario administra el guild (`ManageGuild` / Administrator / owner en
 * Discord). Eso NO implica que pueda usar cualquier capacidad del bot —
 * `ManageGuild` no otorga `BanMembers` ni `ManageRoles` por sí solo. Este
 * módulo añade una segunda comprobación, por capacidad, antes de ejecutar
 * cualquier acción que use la autoridad del bot.
 *
 * Extiende ligeramente la lista de ejemplo del plan: separa `moderation.purge`
 * de `channels.write` porque en Discord son bits distintos (`ManageMessages`
 * vs `ManageChannels`) y colapsarlos habría permitido purgar mensajes con
 * solo permiso de canal, o viceversa.
 */
export type GuildCapability =
  | "settings.read"
  | "settings.write"
  | "moderation.warn"
  | "moderation.kick"
  | "moderation.ban"
  | "moderation.timeout"
  | "moderation.purge"
  | "roles.write"
  | "channels.write"
  | "webhooks.write"
  | "billing.write";

/**
 * Bit de Discord requerido por capacidad. `null` = ya cubierto por el piso de
 * `requireGuildAccess` (ManageGuild/Administrator/owner) — no hay un permiso
 * de Discord más granular para "leer/escribir configuración del panel".
 */
const CAPABILITY_BITS: Record<GuildCapability, bigint | null> = {
  "settings.read": null,
  "settings.write": null,
  "moderation.warn": PermissionFlagsBits.ModerateMembers,
  "moderation.kick": PermissionFlagsBits.KickMembers,
  "moderation.ban": PermissionFlagsBits.BanMembers,
  "moderation.timeout": PermissionFlagsBits.ModerateMembers,
  "moderation.purge": PermissionFlagsBits.ManageMessages,
  "roles.write": PermissionFlagsBits.ManageRoles,
  "channels.write": PermissionFlagsBits.ManageChannels,
  "webhooks.write": PermissionFlagsBits.ManageWebhooks,
  // Billing mueve dinero real del dueño del servidor: piso más alto que
  // ManageGuild (Administrator u owner), no un bit de Discord dedicado.
  "billing.write": PermissionFlagsBits.Administrator,
};

export interface ActorGuildAuthority {
  owner: boolean;
  administrator: boolean;
  bits: bigint;
}

function parsePermissionBits(raw: string): bigint {
  try {
    return BigInt(raw || "0");
  } catch {
    return 0n;
  }
}

/**
 * Autoridad efectiva del actor en el guild — mismo caché de 60s que
 * `requireGuildAccess` (sin llamadas extra a Discord). `undefined` si el
 * actor no gestiona ese guild (no debería llegar aquí si `requireGuildAccess`
 * ya corrió, pero se revalida por si acaso).
 */
export async function actorGuildAuthority(
  session: StoredSession,
  guildId: string,
): Promise<ActorGuildAuthority | undefined> {
  const managed = await actorManagedGuild(session, guildId);
  if (!managed) return undefined;
  const bits = parsePermissionBits(managed.permissions);
  return {
    owner: managed.owner,
    administrator:
      (bits & PermissionFlagsBits.Administrator) ===
      PermissionFlagsBits.Administrator,
    bits,
  };
}

/** Owner/Administrator siempre pasan; el resto necesita el bit exacto. */
export function authorityHasCapability(
  authority: ActorGuildAuthority,
  capability: GuildCapability,
): boolean {
  if (authority.owner || authority.administrator) return true;
  const required = CAPABILITY_BITS[capability];
  if (required === null) return true;
  return (authority.bits & required) === required;
}

export async function actorHasCapability(
  session: StoredSession,
  guildId: string,
  capability: GuildCapability,
): Promise<boolean> {
  const authority = await actorGuildAuthority(session, guildId);
  if (!authority) return false;
  return authorityHasCapability(authority, capability);
}

export interface HierarchyDenial {
  ok: false;
  reason: string;
}

export interface HierarchyOk {
  ok: true;
}

function highestPosition(
  roleIds: { id: string }[],
  positionById: Map<string, number>,
): number {
  let max = 0;
  for (const role of roleIds) {
    const pos = positionById.get(role.id);
    if (pos !== undefined && pos > max) max = pos;
  }
  return max;
}

/**
 * Jerarquía actor–objetivo (además de la jerarquía bot–objetivo que ya
 * valida `assertBotCanAct`). Owner/Administrator del actor pasan siempre —
 * igual que en Discord, donde el owner nunca está sujeto a jerarquía de roles.
 * Si el objetivo no es miembro actual del guild (baneado / ya se fue), no hay
 * jerarquía que validar: se permite (la jerarquía bot–objetivo sigue aplicando
 * aparte).
 */
export async function assertActorOutranksMember(
  gateway: BotGateway,
  authority: ActorGuildAuthority,
  guildId: string,
  actorUserId: string,
  targetUserId: string,
): Promise<HierarchyOk | HierarchyDenial> {
  if (authority.owner || authority.administrator) return { ok: true };

  const [actorMember, targetMember, roles] = await Promise.all([
    gateway.getMember(guildId, actorUserId),
    gateway.getMember(guildId, targetUserId),
    gateway.listRoles(guildId),
  ]);
  if (!targetMember) return { ok: true };
  if (!actorMember) {
    return {
      ok: false,
      reason: "You must be a member of this server to do that.",
    };
  }

  const positionById = new Map<string, number>(
    roles.map((role: RoleSummary) => [role.id, role.position]),
  );
  const actorPosition = highestPosition(actorMember.roles, positionById);
  const targetPosition = highestPosition(targetMember.roles, positionById);

  if (targetPosition >= actorPosition) {
    return {
      ok: false,
      reason:
        "You can't act on a member with an equal or higher role than yours.",
    };
  }
  return { ok: true };
}

/** Denial homogéneo para capacidad o jerarquía — sin tokens, con contexto para logs. */
export interface GuildPolicyDenial {
  status: number;
  code: string;
  message: string;
}

export function logCapabilityDenied(context: {
  guildId: string;
  actorUserId: string;
  capability: GuildCapability;
  reason: "missing_capability" | "hierarchy";
}): void {
  logger.warn(
    {
      guildId: context.guildId,
      actorUserId: context.actorUserId,
      capability: context.capability,
      reason: context.reason,
    },
    "authz: capability denied",
  );
}
