import { and, eq, isNotNull, lte } from "drizzle-orm";
import type { BotGateway } from "#core/discord/botGateway.js";
import { registerJob } from "#core/lifecycle.js";
import { logger } from "#core/log.js";
import { getDb } from "#db/client.js";
import {
  economyOwnedChannels,
  economyOwnedRoles,
  economyUserBoosts,
} from "#db/schema.js";

const SWEEP_MS = 60_000;

/**
 * Expira roles/canales/boosts temporales de la tienda (vía `BotGateway`, así
 * corre en el `worker` sin `Client`).
 * - Roles creados: se borran de Discord.
 * - Roles asignados existentes: solo se quitan del miembro.
 * - Canales: se eliminan.
 * - Boosts: se borran de la BD.
 */
export async function sweepExpiredShopGrants(
  gateway: BotGateway,
): Promise<void> {
  const now = new Date();

  const expiredRoles = await getDb()
    .select()
    .from(economyOwnedRoles)
    .where(
      and(
        isNotNull(economyOwnedRoles.expiresAt),
        lte(economyOwnedRoles.expiresAt, now),
      ),
    );

  for (const row of expiredRoles) {
    try {
      if (row.deleteRoleOnExpire) {
        await gateway
          .deleteRole(row.guildId, row.roleId, "Shop: temporary role expired")
          .catch(() => undefined);
      } else {
        await gateway
          .removeMemberRole(
            row.guildId,
            row.userId,
            row.roleId,
            "Shop: temporary role expired",
          )
          .catch(() => undefined);
      }
    } catch (error) {
      logger.warn({ detail: [row.id, error] }, "shop expire role:");
    }
    await getDb()
      .delete(economyOwnedRoles)
      .where(eq(economyOwnedRoles.id, row.id));
  }

  const expiredChannels = await getDb()
    .select()
    .from(economyOwnedChannels)
    .where(
      and(
        isNotNull(economyOwnedChannels.expiresAt),
        lte(economyOwnedChannels.expiresAt, now),
      ),
    );

  for (const row of expiredChannels) {
    try {
      await gateway
        .deleteChannel(
          row.guildId,
          row.channelId,
          "Shop: temporary channel expired",
        )
        .catch(() => undefined);
    } catch (error) {
      logger.warn({ detail: [row.id, error] }, "shop expire channel:");
    }
    await getDb()
      .delete(economyOwnedChannels)
      .where(eq(economyOwnedChannels.id, row.id));
  }

  const expiredBoosts = await getDb()
    .select()
    .from(economyUserBoosts)
    .where(
      and(
        isNotNull(economyUserBoosts.expiresAt),
        lte(economyUserBoosts.expiresAt, now),
      ),
    );

  for (const row of expiredBoosts) {
    await getDb()
      .delete(economyUserBoosts)
      .where(eq(economyUserBoosts.id, row.id));
  }
}

let sweepTimer: ReturnType<typeof setInterval> | null = null;

export async function startShopExpirationSweeper(
  gateway: BotGateway,
): Promise<void> {
  if (sweepTimer) return;
  void sweepExpiredShopGrants(gateway);
  sweepTimer = setInterval(() => {
    void sweepExpiredShopGrants(gateway);
  }, SWEEP_MS);
  registerJob("economy:shop-expiration", sweepTimer);
}
