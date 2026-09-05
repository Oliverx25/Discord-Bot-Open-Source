import type {
  EconomyPurchaseStatus,
  EconomyShopItem,
  EconomyShopRewards,
} from "@adobos/shared";
import { applyShopNameTemplate, durationToMinutes } from "@adobos/shared";
import {
  ChannelType,
  EmbedBuilder,
  type Guild,
  type GuildMember,
  PermissionFlagsBits,
  type TextChannel,
} from "discord.js";
import { eq } from "drizzle-orm";
import { logger } from "#core/log.js";
import { getDb } from "#db/client.js";
import {
  economyOwnedChannels,
  economyOwnedRoles,
  economyPurchases,
  economyUserBoosts,
} from "#db/schema.js";
import { getLevelsConfig } from "#modules/levels/domain/levels.js";
import { EconomyError, getEconomyConfig } from "./domain/economy.js";
import { debitShopPurchase, refundShopPurchase } from "./domain/funds.js";
import { getShopItem } from "./domain/shopService.js";

const PRIVATE_CATEGORY_NAME = "Private Zones";

async function ensurePrivateCategory(guild: Guild): Promise<string> {
  const existing = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildCategory &&
      ch.name === PRIVATE_CATEGORY_NAME,
  );
  if (existing) return existing.id;
  const created = await guild.channels.create({
    name: PRIVATE_CATEGORY_NAME,
    type: ChannelType.GuildCategory,
    reason: "Private zones category (shop)",
  });
  return created.id;
}

type RewardResult = { pending?: boolean; meta: Record<string, unknown> };

async function fulfillRole(
  guild: Guild,
  member: GuildMember,
  item: EconomyShopItem,
  purchaseId: string,
): Promise<RewardResult> {
  const cfg = item.rewards.roleConfig;
  const role = await guild.roles.fetch(cfg.roleId).catch(() => null);
  if (!role) {
    throw new EconomyError(
      "The configured role no longer exists.",
      400,
      "ROLE_MISSING",
    );
  }
  await member.roles.add(role, `Shop: ${item.name}`);

  let expiresAt: Date | null = null;
  if (cfg.temporary) {
    expiresAt = new Date(
      Date.now() +
        durationToMinutes(cfg.durationValue, cfg.durationUnit) * 60_000,
    );
  }

  await getDb().insert(economyOwnedRoles).values({
    id: crypto.randomUUID(),
    guildId: guild.id,
    userId: member.id,
    roleId: role.id,
    itemId: item.id,
    purchaseId,
    expiresAt,
    deleteRoleOnExpire: false,
    createdAt: new Date(),
  });

  return {
    meta: {
      type: "role",
      roleId: role.id,
      temporary: cfg.temporary,
      expiresAt: expiresAt?.toISOString() ?? null,
    },
  };
}

async function fulfillChannel(
  guild: Guild,
  member: GuildMember,
  item: EconomyShopItem,
  purchaseId: string,
): Promise<RewardResult> {
  const cfg = item.rewards.channelConfig;
  const vars = {
    username: member.user.username,
    displayname: member.displayName,
    userid: member.id,
  };
  const name =
    applyShopNameTemplate(cfg.nameTemplate, vars)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100) || `privado-${member.id.slice(-4)}`;

  let parentId = cfg.categoryId;
  if (!parentId) parentId = await ensurePrivateCategory(guild);

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: parentId,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
    reason: `Shop: ${item.name}`,
  });

  let expiresAt: Date | null = null;
  if (cfg.temporary) {
    expiresAt = new Date(
      Date.now() +
        durationToMinutes(cfg.durationValue, cfg.durationUnit) * 60_000,
    );
  }

  await getDb().insert(economyOwnedChannels).values({
    id: crypto.randomUUID(),
    guildId: guild.id,
    userId: member.id,
    channelId: channel.id,
    itemId: item.id,
    purchaseId,
    expiresAt,
    createdAt: new Date(),
  });

  return {
    meta: {
      type: "channel",
      channelId: channel.id,
      categoryId: parentId,
      temporary: cfg.temporary,
      expiresAt: expiresAt?.toISOString() ?? null,
    },
  };
}

async function fulfillBoost(
  guild: Guild,
  member: GuildMember,
  item: EconomyShopItem,
  purchaseId: string,
): Promise<RewardResult> {
  const cfg = item.rewards.boostConfig;
  if (cfg.module === "xp") {
    const levels = await getLevelsConfig(guild.id);
    if (!levels.enabled) {
      throw new EconomyError(
        "The Levels module is disabled. This boost can't be applied.",
        400,
        "XP_INACTIVE",
      );
    }
  }

  let expiresAt: Date | null = null;
  if (cfg.temporary) {
    expiresAt = new Date(
      Date.now() +
        durationToMinutes(cfg.durationValue, cfg.durationUnit) * 60_000,
    );
  }

  await getDb()
    .insert(economyUserBoosts)
    .values({
      id: crypto.randomUUID(),
      guildId: guild.id,
      userId: member.id,
      module: cfg.module,
      multiplier: Math.round(cfg.multiplier * 100),
      expiresAt,
      purchaseId,
      createdAt: new Date(),
    });

  return {
    meta: {
      type: "boost",
      module: cfg.module,
      multiplier: cfg.multiplier,
      temporary: cfg.temporary,
      expiresAt: expiresAt?.toISOString() ?? null,
    },
  };
}

async function fulfillManual(
  guild: Guild,
  member: GuildMember,
  item: EconomyShopItem,
  purchaseId: string,
): Promise<RewardResult> {
  const cfg = item.rewards.manualConfig;
  const channel = (await guild.channels
    .fetch(cfg.logChannelId)
    .catch(() => null)) as TextChannel | null;
  if (!channel || !channel.isTextBased()) {
    throw new EconomyError(
      "The ticket log channel is not valid.",
      400,
      "LOG_CHANNEL_MISSING",
    );
  }

  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle("🎫 Nueva Orden de Compra")
    .setDescription(
      `**${member.displayName}** (<@${member.id}>) bought **${item.name}**.`,
    )
    .addFields(
      {
        name: "Instrucciones para staff",
        value: cfg.staffInstructions || "—",
      },
      {
        name: "Precio pagado",
        value: `\`${item.price}\``,
        inline: true,
      },
      {
        name: "Compra ID",
        value: `\`${purchaseId}\``,
        inline: true,
      },
    )
    .setTimestamp(new Date());

  const message = await channel.send({
    content: `<@&${cfg.pingRoleId}>`,
    embeds: [embed],
    allowedMentions: { roles: [cfg.pingRoleId] },
  });

  let threadId: string | null = null;
  if (
    message &&
    "startThread" in message &&
    typeof message.startThread === "function"
  ) {
    try {
      const thread = await message.startThread({
        name: `Orden ${item.name}`.slice(0, 100),
        autoArchiveDuration: 1440,
        reason: `Seguimiento compra ${purchaseId}`,
      });
      threadId = thread.id;
      await thread.send({
        content: `Delivery tracking for <@${member.id}>. Mark it when it's ready.`,
      });
    } catch (error) {
      logger.warn({ err: error }, "shop MANUAL_TICKET thread:");
    }
  }

  return {
    pending: true,
    meta: {
      type: "manual",
      logChannelId: cfg.logChannelId,
      pingRoleId: cfg.pingRoleId,
      messageId: message.id,
      threadId,
    },
  };
}

async function preflightRewards(
  guildId: string,
  rewards: EconomyShopRewards,
): Promise<void> {
  if (rewards.hasBoost && rewards.boostConfig.module === "xp") {
    const levels = await getLevelsConfig(guildId);
    if (!levels.enabled) {
      throw new EconomyError(
        "The Levels module is disabled. This item can't be bought.",
        400,
        "XP_INACTIVE",
      );
    }
  }
}

type RewardKind = "role" | "channel" | "boost" | "manual";

interface CompletedStep {
  kind: RewardKind;
  meta: Record<string, unknown>;
}

/**
 * ECO-01 (PLAN_FINAL_2026.md): deshace un paso ya concedido cuando un paso
 * posterior falla. Devuelve `false` cuando el efecto real no pudo revertirse
 * (Discord rechazó el `remove`/`delete`, o el reward es un ticket manual que
 * ya notificó a staff y no se puede des-notificar) — el caller nunca reembolsa
 * automáticamente en ese caso, para no regalar la recompensa Y el dinero.
 */
async function compensateStep(
  guild: Guild,
  member: GuildMember,
  purchaseId: string,
  step: CompletedStep,
): Promise<boolean> {
  try {
    switch (step.kind) {
      case "role": {
        const roleId = String(step.meta.roleId ?? "");
        if (roleId) {
          await member.roles.remove(roleId, "Purchase rollback (ECO-01)");
        }
        await getDb()
          .delete(economyOwnedRoles)
          .where(eq(economyOwnedRoles.purchaseId, purchaseId));
        return true;
      }
      case "channel": {
        const channelId = String(step.meta.channelId ?? "");
        const channel = channelId
          ? (guild.channels.cache.get(channelId) ??
            (await guild.channels.fetch(channelId).catch(() => null)))
          : null;
        if (channel) {
          await channel.delete("Purchase rollback (ECO-01)");
        }
        await getDb()
          .delete(economyOwnedChannels)
          .where(eq(economyOwnedChannels.purchaseId, purchaseId));
        return true;
      }
      case "boost": {
        await getDb()
          .delete(economyUserBoosts)
          .where(eq(economyUserBoosts.purchaseId, purchaseId));
        return true;
      }
      case "manual": {
        // No hay fila propia que borrar y el ping/hilo de staff ya se vio —
        // no hay forma real de "des-notificar". No se puede garantizar la
        // reversión, así que se trata como compensación fallida a propósito.
        logger.warn(
          { purchaseId, messageId: step.meta.messageId },
          "shop rollback: manual ticket needs staff cancellation (can't auto-compensate)",
        );
        return false;
      }
      default:
        return true;
    }
  } catch (error: unknown) {
    logger.error(
      { err: error, purchaseId, kind: step.kind },
      "shop rollback: compensation failed",
    );
    return false;
  }
}

export interface PurchaseResult {
  purchaseId: string;
  item: EconomyShopItem;
  status: EconomyPurchaseStatus;
  wallet: number;
  bank: number;
  metadata: Record<string, unknown>;
}

/**
 * Compra un ítem y ejecuta las recompensas con Switch activo.
 */
export async function purchaseShopItem(
  guild: Guild,
  member: GuildMember,
  itemId: string,
): Promise<PurchaseResult> {
  const config = await getEconomyConfig(guild.id);
  if (!config.isActive) {
    throw new EconomyError(
      "The economy is paused in this server.",
      400,
      "ECONOMY_PAUSED",
    );
  }

  const item = await getShopItem(itemId, guild.id);
  if (!item || !item.enabled) {
    throw new EconomyError("Item unavailable.", 404, "ITEM_UNAVAILABLE");
  }
  if (item.stock !== null && item.stock <= 0) {
    throw new EconomyError("Sin stock disponible.", 400, "OUT_OF_STOCK");
  }

  await preflightRewards(guild.id, item.rewards);

  const balances = await debitShopPurchase(
    guild.id,
    member.id,
    item.id,
    item.price,
  );

  const purchaseId = crypto.randomUUID();

  // ECO-01: fila `pending` ANTES de tocar Discord. Si el proceso muere en
  // mitad del fulfillment, queda un registro durable de que se cobró y qué
  // se estaba entregando — antes no había ninguna fila hasta el final.
  await getDb()
    .insert(economyPurchases)
    .values({
      id: purchaseId,
      guildId: guild.id,
      userId: member.id,
      itemId: item.id,
      itemName: item.name,
      pricePaid: item.price,
      status: "pending",
      metadata: JSON.stringify({ rewards: [] }),
      createdAt: new Date(),
    });

  const steps: Array<{ kind: RewardKind; run: () => Promise<RewardResult> }> =
    [];
  if (item.rewards.hasRole) {
    steps.push({
      kind: "role",
      run: () => fulfillRole(guild, member, item, purchaseId),
    });
  }
  if (item.rewards.hasChannel) {
    steps.push({
      kind: "channel",
      run: () => fulfillChannel(guild, member, item, purchaseId),
    });
  }
  if (item.rewards.hasBoost) {
    steps.push({
      kind: "boost",
      run: () => fulfillBoost(guild, member, item, purchaseId),
    });
  }
  if (item.rewards.hasManual) {
    steps.push({
      kind: "manual",
      run: () => fulfillManual(guild, member, item, purchaseId),
    });
  }

  const completed: CompletedStep[] = [];
  let anyPending = false;
  let failure: unknown = null;

  // ECO-01: secuencial, no `Promise.all` — si el paso N falla, se sabe EXACTO
  // qué pasos 1..N-1 ya se concedieron (Discord + fila propia) y hay que revertir.
  for (const step of steps) {
    try {
      const result = await step.run();
      completed.push({ kind: step.kind, meta: result.meta });
      if (result.pending) anyPending = true;
    } catch (error: unknown) {
      failure = error;
      break;
    }
  }

  if (failure) {
    let compensationOk = true;
    for (const step of [...completed].reverse()) {
      const ok = await compensateStep(guild, member, purchaseId, step);
      if (!ok) compensationOk = false;
    }

    const errorMessage = failure instanceof Error ? failure.message : "unknown";

    if (compensationOk) {
      // Todas las recompensas ya concedidas se revirtieron de verdad —
      // recién ahora es seguro reembolsar.
      await refundShopPurchase(
        guild.id,
        member.id,
        item.id,
        item.price,
        item.stock !== null,
      );
      await getDb()
        .update(economyPurchases)
        .set({
          status: "refunded",
          metadata: JSON.stringify({
            error: errorMessage,
            compensated: completed.map((c) => c.kind),
          }),
        })
        .where(eq(economyPurchases.id, purchaseId));
    } else {
      // No se puede garantizar que la(s) recompensa(s) ya entregadas se
      // revirtieron — reembolsar aquí regalaría la recompensa Y el dinero.
      // Queda para soporte; el historial trae todo lo necesario para resolverlo.
      logger.error(
        { purchaseId, guildId: guild.id, userId: member.id },
        "shop: purchase needs manual reconciliation — reward(s) couldn't be reverted, no automatic refund",
      );
      await getDb()
        .update(economyPurchases)
        .set({
          status: "needs_reconciliation",
          metadata: JSON.stringify({
            error: errorMessage,
            partialRewards: completed,
          }),
        })
        .where(eq(economyPurchases.id, purchaseId));
    }

    throw failure;
  }

  const status: EconomyPurchaseStatus = anyPending ? "pending" : "fulfilled";
  const metadata = { rewards: completed.map((c) => c.meta) };

  await getDb()
    .update(economyPurchases)
    .set({ status, metadata: JSON.stringify(metadata) })
    .where(eq(economyPurchases.id, purchaseId));

  return {
    purchaseId,
    item,
    status,
    wallet: balances.wallet,
    bank: balances.bank,
    metadata,
  };
}
