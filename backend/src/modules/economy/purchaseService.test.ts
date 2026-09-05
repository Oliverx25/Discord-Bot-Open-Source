import { defaultShopRewards, type EconomyShopItem } from "@adobos/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ECO-01 (PLAN_FINAL_2026.md): antes, varios rewards corrían en
 * `Promise.all`; si uno fallaba después de que otro ya hubiera concedido su
 * efecto real (rol asignado, canal creado), el catch reembolsaba el precio
 * completo SIN revertir lo ya concedido — el usuario se quedaba con la
 * recompensa parcial Y el dinero. Estos tests reproducen exactamente ese
 * escenario contra la implementación corregida (secuencial + compensación).
 */

const dbCalls: Array<{
  op: "insert" | "update" | "delete";
  table: unknown;
  payload?: unknown;
}> = [];

vi.mock("#db/client.js", () => ({
  getDb: () => ({
    insert: (table: unknown) => ({
      values: (payload: unknown) => {
        dbCalls.push({ op: "insert", table, payload });
        return Promise.resolve();
      },
    }),
    update: (table: unknown) => ({
      set: (payload: unknown) => ({
        where: () => {
          dbCalls.push({ op: "update", table, payload });
          return Promise.resolve();
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: () => {
        dbCalls.push({ op: "delete", table });
        return Promise.resolve();
      },
    }),
  }),
}));

const getEconomyConfigMock = vi.fn();
vi.mock("./domain/economy.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./domain/economy.js")>();
  return {
    ...actual,
    getEconomyConfig: (...args: unknown[]) => getEconomyConfigMock(...args),
  };
});

const getShopItemMock = vi.fn();
vi.mock("./domain/shopService.js", () => ({
  getShopItem: (...args: unknown[]) => getShopItemMock(...args),
}));

const debitShopPurchaseMock = vi.fn();
const refundShopPurchaseMock = vi.fn();
vi.mock("./domain/funds.js", () => ({
  debitShopPurchase: (...args: unknown[]) => debitShopPurchaseMock(...args),
  refundShopPurchase: (...args: unknown[]) => refundShopPurchaseMock(...args),
}));

vi.mock("#modules/levels/domain/levels.js", () => ({
  getLevelsConfig: vi.fn(async () => ({ enabled: true })),
}));

const { purchaseShopItem } = await import("./purchaseService.js");
const { economyOwnedRoles, economyOwnedChannels, economyPurchases } =
  await import("#db/schema.js");

function item(overrides: Partial<EconomyShopItem["rewards"]>): EconomyShopItem {
  return {
    id: "item-1",
    guildId: "g1",
    name: "Combo",
    description: "",
    price: 100,
    icon: "🛒",
    stock: null,
    enabled: true,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rewards: { ...defaultShopRewards(), ...overrides },
  };
}

function fakeGuildAndMember(opts: { channelCreateFails?: boolean } = {}) {
  const roleRemoveCalls: string[] = [];
  const channelDeleteCalls: string[] = [];
  const fakeRole = { id: "role-1" };
  const fakeChannel = {
    id: "chan-1",
    delete: vi.fn(async () => {
      channelDeleteCalls.push("chan-1");
    }),
  };
  const guild = {
    id: "g1",
    roles: { fetch: vi.fn(async () => fakeRole) },
    channels: {
      cache: { get: vi.fn(() => fakeChannel), find: vi.fn(() => undefined) },
      create: vi.fn(async () => {
        if (opts.channelCreateFails) {
          throw new Error("Discord API error: Missing Permissions");
        }
        return fakeChannel;
      }),
      fetch: vi.fn(async () => fakeChannel),
    },
  };
  const member = {
    id: "u1",
    displayName: "Tester",
    user: { username: "tester" },
    roles: {
      add: vi.fn(async () => undefined),
      remove: vi.fn(async (roleId: string) => {
        roleRemoveCalls.push(roleId);
      }),
    },
  };
  return { guild, member, roleRemoveCalls, channelDeleteCalls };
}

beforeEach(() => {
  dbCalls.length = 0;
  getEconomyConfigMock.mockReset().mockResolvedValue({ isActive: true });
  debitShopPurchaseMock.mockReset().mockResolvedValue({ wallet: 900, bank: 0 });
  refundShopPurchaseMock.mockReset().mockResolvedValue(undefined);
});

describe("purchaseShopItem — saga con compensación (ECO-01)", () => {
  it("cuando el segundo reward falla, revierte el primero y SÍ reembolsa (status refunded)", async () => {
    const it1 = item({ hasRole: true, hasChannel: true });
    getShopItemMock.mockResolvedValue(it1);
    const { guild, member, roleRemoveCalls } = fakeGuildAndMember({
      channelCreateFails: true,
    });

    await expect(
      purchaseShopItem(guild as never, member as never, it1.id),
    ).rejects.toThrow();

    // El rol SÍ se otorgó (paso 1 exitoso) y luego se revirtió (compensación).
    expect(member.roles.add).toHaveBeenCalledTimes(1);
    expect(roleRemoveCalls).toEqual(["role-1"]);

    // El reembolso solo ocurre porque la compensación fue exitosa.
    expect(refundShopPurchaseMock).toHaveBeenCalledTimes(1);

    const finalUpdate = dbCalls.findLast(
      (c) => c.op === "update" && c.table === economyPurchases,
    );
    expect((finalUpdate?.payload as { status?: string })?.status).toBe(
      "refunded",
    );

    // La fila de rol otorgado se borra al compensar.
    expect(
      dbCalls.some((c) => c.op === "delete" && c.table === economyOwnedRoles),
    ).toBe(true);
  });

  it("cuando la recompensa ya entregada no puede revertirse de verdad, NO reembolsa y marca needs_reconciliation", async () => {
    const it2 = item({ hasRole: true, hasChannel: true });
    getShopItemMock.mockResolvedValue(it2);
    const { guild, member } = fakeGuildAndMember({ channelCreateFails: true });
    // El rol se otorgó (paso 1), pero Discord rechaza la reversión (p. ej. el
    // bot perdió el permiso ManageRoles entre medio) — compensación fallida real.
    member.roles.remove = vi.fn(async () => {
      throw new Error("Missing Permissions");
    });

    await expect(
      purchaseShopItem(guild as never, member as never, it2.id),
    ).rejects.toThrow();

    // La reversión no se pudo garantizar -> nunca se reembolsa.
    expect(refundShopPurchaseMock).not.toHaveBeenCalled();

    const finalUpdate = dbCalls.findLast(
      (c) => c.op === "update" && c.table === economyPurchases,
    );
    expect((finalUpdate?.payload as { status?: string })?.status).toBe(
      "needs_reconciliation",
    );
  });

  it("inserta la compra como pending ANTES de tocar cualquier reward", async () => {
    const it3 = item({ hasRole: true });
    getShopItemMock.mockResolvedValue(it3);
    const { guild, member } = fakeGuildAndMember();

    await purchaseShopItem(guild as never, member as never, it3.id);

    const firstPurchaseWrite = dbCalls.find(
      (c) => c.table === economyPurchases,
    );
    expect(firstPurchaseWrite?.op).toBe("insert");
    expect((firstPurchaseWrite?.payload as { status?: string })?.status).toBe(
      "pending",
    );
    // El insert de la compra pending ocurre antes de otorgar el rol.
    const roleAddCallOrder = (member.roles.add as ReturnType<typeof vi.fn>).mock
      .invocationCallOrder[0];
    expect(dbCalls.indexOf(firstPurchaseWrite!)).toBeGreaterThanOrEqual(0);
    expect(roleAddCallOrder).toBeGreaterThan(0);
  });

  it("camino feliz: todos los rewards ok -> status fulfilled, sin reembolso", async () => {
    const it4 = item({ hasRole: true, hasChannel: true });
    getShopItemMock.mockResolvedValue(it4);
    const { guild, member } = fakeGuildAndMember();

    const result = await purchaseShopItem(
      guild as never,
      member as never,
      it4.id,
    );

    expect(result.status).toBe("fulfilled");
    expect(refundShopPurchaseMock).not.toHaveBeenCalled();
    const finalUpdate = dbCalls.findLast(
      (c) => c.op === "update" && c.table === economyPurchases,
    );
    expect((finalUpdate?.payload as { status?: string })?.status).toBe(
      "fulfilled",
    );
  });

  it("no compensa canales/roles que nunca llegaron a otorgarse (channel fue el primero en fallar)", async () => {
    // Orden fijo del sistema: role corre antes que channel, así que para
    // aislar "el único paso falla de entrada, nada que compensar" se prueba
    // con un ítem que solo tiene reward de canal.
    const onlyChannel = item({ hasChannel: true });
    getShopItemMock.mockResolvedValue(onlyChannel);
    const { guild, member } = fakeGuildAndMember({ channelCreateFails: true });

    await expect(
      purchaseShopItem(guild as never, member as never, onlyChannel.id),
    ).rejects.toThrow();

    // Nada que compensar (el único paso falló de entrada) -> reembolso directo.
    expect(refundShopPurchaseMock).toHaveBeenCalledTimes(1);
    expect(
      dbCalls.some(
        (c) => c.op === "delete" && c.table === economyOwnedChannels,
      ),
    ).toBe(false);
  });
});
