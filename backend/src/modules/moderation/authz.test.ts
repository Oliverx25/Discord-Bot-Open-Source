import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredSession } from "#core/auth/types.js";
import type { GuildCapability } from "#core/authz/guildPolicy.js";
import type { BotGateway } from "#core/discord/botGateway.js";
import { HttpError } from "#core/http/httpError.js";

const authorityFor = vi.fn();
const hasCapability = vi.fn();
const outranks = vi.fn();
const logDenied = vi.fn();

vi.mock("#core/authz/guildPolicy.js", () => ({
  actorGuildAuthority: (...args: unknown[]) => authorityFor(...args),
  authorityHasCapability: (...args: unknown[]) => hasCapability(...args),
  assertActorOutranksMember: (...args: unknown[]) => outranks(...args),
  logCapabilityDenied: (...args: unknown[]) => logDenied(...args),
}));

const { assertModActionAuthorized } = await import("./authz.js");

function session(): StoredSession {
  return {
    id: "sid",
    userId: "actor-1",
    username: "u",
    globalName: null,
    avatar: null,
    accessTokenEnc: "enc",
    refreshTokenEnc: null,
    accessExpiresAt: null,
    expiresAt: new Date(Date.now() + 1000),
  };
}

const gateway = {} as BotGateway;
const AUTHORITY = { owner: false, administrator: false, bits: 0n };

beforeEach(() => {
  authorityFor.mockReset().mockResolvedValue(AUTHORITY);
  hasCapability.mockReset();
  outranks.mockReset().mockResolvedValue({ ok: true });
  logDenied.mockReset();
});

describe("assertModActionAuthorized", () => {
  it("rejects with 403 CAPABILITY_DENIED when the actor lacks the Discord permission", async () => {
    hasCapability.mockReturnValue(false);
    await expect(
      assertModActionAuthorized(gateway, session(), "g1", {
        action: "ban",
        userId: "target-1",
      }),
    ).rejects.toMatchObject({ status: 403, code: "CAPABILITY_DENIED" });
    expect(outranks).not.toHaveBeenCalled();
    expect(logDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "missing_capability",
        capability: "moderation.ban",
      }),
    );
  });

  it("rejects with 403 when actorGuildAuthority is undefined (actor no longer manages the guild)", async () => {
    authorityFor.mockResolvedValue(undefined);
    hasCapability.mockReturnValue(true); // no debería ni llegar a usarse
    await expect(
      assertModActionAuthorized(gateway, session(), "g1", {
        action: "warn",
        userId: "target-1",
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("checks actor–target hierarchy for member-targeted actions", async () => {
    hasCapability.mockReturnValue(true);
    outranks.mockResolvedValue({ ok: false, reason: "nope" });
    await expect(
      assertModActionAuthorized(gateway, session(), "g1", {
        action: "kick",
        userId: "target-1",
      }),
    ).rejects.toMatchObject({ status: 403, code: "HIERARCHY_DENIED" });
    expect(outranks).toHaveBeenCalledWith(
      gateway,
      AUTHORITY,
      "g1",
      "actor-1",
      "target-1",
    );
  });

  it("allows the action when capability and hierarchy both pass", async () => {
    hasCapability.mockReturnValue(true);
    outranks.mockResolvedValue({ ok: true });
    await expect(
      assertModActionAuthorized(gateway, session(), "g1", {
        action: "ban",
        userId: "target-1",
      }),
    ).resolves.toBeUndefined();
  });

  it("skips the hierarchy check for channel-targeted actions (purge/slowmode/lock/unlock)", async () => {
    hasCapability.mockReturnValue(true);
    await assertModActionAuthorized(gateway, session(), "g1", {
      action: "purge",
      userId: undefined,
    });
    expect(outranks).not.toHaveBeenCalled();
  });

  it.each<GuildCapability>([
    "moderation.ban",
    "moderation.kick",
    "moderation.timeout",
  ])(
    "still requires the mapped capability (%s) even when authority looks broad",
    async (capability) => {
      hasCapability.mockImplementation(
        (_a, cap: GuildCapability) => cap === capability,
      );
      const action =
        capability === "moderation.ban"
          ? "ban"
          : capability === "moderation.kick"
            ? "kick"
            : "timeout";
      await expect(
        assertModActionAuthorized(gateway, session(), "g1", {
          action: action as never,
          userId: "target-1",
        }),
      ).resolves.toBeUndefined();
    },
  );
});
