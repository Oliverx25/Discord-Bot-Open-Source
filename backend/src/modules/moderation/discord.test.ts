import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BotGateway } from "#core/discord/botGateway.js";

/**
 * Fase 7 (MAINT-01): `executeModAction` no tenía tests — se agregan acá al
 * dividir el switch monolítico original en handlers por acción (uno por
 * `ModActionType`) para dejar la refactorización cubierta por regresión.
 * No se prueban carreras/transacciones (por eso `#db/client.js` mockeado
 * está bien acá, a diferencia de billing/economy) — cada acción hace un
 * único insert/update/delete simple.
 */

const dbCalls: Array<{
  op: "insert" | "update" | "delete";
  table: unknown;
  payload?: unknown;
}> = [];

vi.mock("#db/client.js", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
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
      where: () => ({
        returning: () => {
          dbCalls.push({ op: "delete", table });
          return Promise.resolve([{ id: 1 }]);
        },
      }),
    }),
  }),
  one: async (query: Promise<unknown[]>) => {
    const rows = await query;
    return rows[0];
  },
}));

const { executeModAction } = await import("./discord.js");

function fakeGateway(overrides: Partial<BotGateway> = {}): BotGateway {
  return {
    isReady: () => true,
    getGuild: async () => ({
      id: "111111111111111111",
      name: "Guild",
      iconUrl: null,
      boosterRoleId: null,
    }),
    getBotProfile: async () => {
      throw new Error("not configured for this test");
    },
    getMember: async () => ({
      userId: "222222222222222222",
      username: "target",
      globalName: null,
      displayName: "target",
      avatarUrl: "",
      bot: false,
      joinedAt: null,
      timedOutUntil: null,
      roles: [],
    }),
    getMemberActionability: async () => ({
      isBot: false,
      isOwner: false,
      bannable: true,
      kickable: true,
      moderatable: true,
    }),
    kickMember: async () => {},
    banMember: async () => {},
    unbanMember: async () => {},
    timeoutMember: async () => {},
    getChannel: async () => ({
      id: "333333333333333333",
      name: "general",
      type: 0,
      parentId: null,
      position: 0,
    }),
    bulkDeleteMessages: async () => 3,
    setChannelSlowmode: async () => {},
    getChannelOverwrites: async () => [],
    putChannelOverwrite: async () => {},
    ...overrides,
  } as unknown as BotGateway;
}

beforeEach(() => {
  dbCalls.length = 0;
});

describe("executeModAction", () => {
  it("rejects when a reason is required and missing", async () => {
    await expect(
      executeModAction(
        fakeGateway(),
        {
          guildId: "111111111111111111",
          action: "ban",
          userId: "222222222222222222",
        },
        "actor",
      ),
    ).rejects.toMatchObject({ status: 400, code: "MISSING_REASON" });
  });

  it("warn: inserts a warning row and reports it in the message", async () => {
    const res = await executeModAction(
      fakeGateway(),
      {
        guildId: "111111111111111111",
        action: "warn",
        userId: "222222222222222222",
        reason: "spam",
      },
      "actor",
    );
    expect(res).toMatchObject({ ok: true, action: "warn" });
    expect(res.message).toContain("<@222222222222222222>");
    expect(dbCalls.some((c) => c.op === "insert")).toBe(true);
  });

  it("kick: calls gateway.kickMember and reports the username", async () => {
    const kickMember = vi.fn(async () => {});
    const res = await executeModAction(
      fakeGateway({ kickMember }),
      {
        guildId: "111111111111111111",
        action: "kick",
        userId: "222222222222222222",
        reason: "spam",
      },
      "actor",
    );
    expect(kickMember).toHaveBeenCalledWith(
      "111111111111111111",
      "222222222222222222",
      "spam",
    );
    expect(res.message).toContain("target");
  });

  it("ban: calls gateway.banMember with deleteMessageSeconds derived from days", async () => {
    const banMember = vi.fn(async () => {});
    await executeModAction(
      fakeGateway({ banMember }),
      {
        guildId: "111111111111111111",
        action: "ban",
        userId: "222222222222222222",
        reason: "spam",
        deleteMessageDays: 2,
      },
      "actor",
    );
    expect(banMember).toHaveBeenCalledWith(
      "111111111111111111",
      "222222222222222222",
      {
        reason: "spam",
        deleteMessageSeconds: 2 * 24 * 60 * 60,
      },
    );
  });

  it("unban: calls gateway.unbanMember and never sends a DM", async () => {
    const unbanMember = vi.fn(async () => {});
    const res = await executeModAction(
      fakeGateway({ unbanMember }),
      {
        guildId: "111111111111111111",
        action: "unban",
        userId: "222222222222222222",
        reason: "appeal",
      },
      "actor",
    );
    expect(unbanMember).toHaveBeenCalledWith(
      "111111111111111111",
      "222222222222222222",
      "appeal",
    );
    expect(res.dmSkipped).toBe(true);
    expect(res.dmSent).toBe(false);
  });

  it("timeout: rejects an invalid duration before calling the gateway", async () => {
    const timeoutMember = vi.fn(async () => {});
    await expect(
      executeModAction(
        fakeGateway({ timeoutMember }),
        {
          guildId: "111111111111111111",
          action: "timeout",
          userId: "222222222222222222",
          reason: "spam",
          durationSeconds: 0,
        },
        "actor",
      ),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_TIMEOUT" });
    expect(timeoutMember).not.toHaveBeenCalled();
  });

  it("timeout: applies a valid duration", async () => {
    const timeoutMember = vi.fn(async () => {});
    const res = await executeModAction(
      fakeGateway({ timeoutMember }),
      {
        guildId: "111111111111111111",
        action: "timeout",
        userId: "222222222222222222",
        reason: "spam",
        durationSeconds: 60,
      },
      "actor",
    );
    expect(timeoutMember).toHaveBeenCalledWith(
      "111111111111111111",
      "222222222222222222",
      expect.any(String),
      "spam",
    );
    expect(res.message).toContain("60s");
  });

  it("untimeout: clears the timeout and never sends a DM", async () => {
    const timeoutMember = vi.fn(async () => {});
    const res = await executeModAction(
      fakeGateway({ timeoutMember }),
      {
        guildId: "111111111111111111",
        action: "untimeout",
        userId: "222222222222222222",
      },
      "actor",
    );
    expect(timeoutMember).toHaveBeenCalledWith(
      "111111111111111111",
      "222222222222222222",
      null,
      expect.any(String),
    );
    expect(res.dmSkipped).toBe(true);
  });

  it("clearwarns: deletes warnings and reports the count", async () => {
    const res = await executeModAction(
      fakeGateway(),
      {
        guildId: "111111111111111111",
        action: "clearwarns",
        userId: "222222222222222222",
      },
      "actor",
    );
    expect(res.message).toContain("1 warnings");
    expect(dbCalls.some((c) => c.op === "delete")).toBe(true);
  });

  it("purge: calls bulkDeleteMessages with the requested limit and filter", async () => {
    const bulkDeleteMessages = vi.fn(async () => 5);
    const res = await executeModAction(
      fakeGateway({ bulkDeleteMessages }),
      {
        guildId: "111111111111111111",
        action: "purge",
        channelId: "333333333333333333",
        purgeLimit: 20,
        userId: "222222222222222222",
      },
      "actor",
    );
    expect(bulkDeleteMessages).toHaveBeenCalledWith("333333333333333333", {
      limit: 20,
      filterUserId: "222222222222222222",
    });
    expect(res.message).toContain("5 messages");
  });

  it("slowmode: clamps seconds and reports enabled state", async () => {
    const setChannelSlowmode = vi.fn(async () => {});
    const res = await executeModAction(
      fakeGateway({ setChannelSlowmode }),
      {
        guildId: "111111111111111111",
        action: "slowmode",
        channelId: "333333333333333333",
        slowmodeSeconds: 999999,
      },
      "actor",
    );
    expect(setChannelSlowmode).toHaveBeenCalledWith(
      "111111111111111111",
      "333333333333333333",
      21600,
      expect.any(String),
    );
    expect(res.message).toContain("21600s");
  });

  it("lock: sets the SendMessages deny bit for @everyone", async () => {
    const putChannelOverwrite = vi.fn(async () => {});
    const res = await executeModAction(
      fakeGateway({ putChannelOverwrite }),
      {
        guildId: "111111111111111111",
        action: "lock",
        channelId: "333333333333333333",
      },
      "actor",
    );
    expect(putChannelOverwrite).toHaveBeenCalled();
    expect(res.message).toContain("locked");
  });

  it("unlock: clears the SendMessages deny bit for @everyone", async () => {
    const putChannelOverwrite = vi.fn(async () => {});
    const res = await executeModAction(
      fakeGateway({ putChannelOverwrite }),
      {
        guildId: "111111111111111111",
        action: "unlock",
        channelId: "333333333333333333",
      },
      "actor",
    );
    expect(putChannelOverwrite).toHaveBeenCalled();
    expect(res.message).toContain("unlocked");
  });
});
