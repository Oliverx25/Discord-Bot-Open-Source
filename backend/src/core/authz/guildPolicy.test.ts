import { PermissionFlagsBits } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredSession } from "#core/auth/types.js";
import type {
  BotGateway,
  MemberInfo,
  RoleSummary,
} from "#core/discord/botGateway.js";

const managedGuilds = new Map<
  string,
  { owner: boolean; permissions: string }
>();

vi.mock("#core/auth/discordGuilds.js", () => ({
  actorManagedGuild: vi.fn(async (session: StoredSession, guildId: string) => {
    const key = `${session.userId}:${guildId}`;
    const entry = managedGuilds.get(key);
    if (!entry) return undefined;
    return {
      id: guildId,
      name: "g",
      icon: null,
      iconUrl: null,
      owner: entry.owner,
      permissions: entry.permissions,
    };
  }),
}));

const {
  actorGuildAuthority,
  authorityHasCapability,
  assertActorOutranksMember,
} = await import("./guildPolicy.js");

function session(userId: string): StoredSession {
  return {
    id: "sid",
    userId,
    username: "u",
    globalName: null,
    avatar: null,
    accessTokenEnc: "enc",
    refreshTokenEnc: null,
    accessExpiresAt: null,
    expiresAt: new Date(Date.now() + 1000),
  };
}

function setManaged(
  userId: string,
  guildId: string,
  opts: { owner?: boolean; bits?: bigint },
): void {
  managedGuilds.set(`${userId}:${guildId}`, {
    owner: opts.owner ?? false,
    permissions: (opts.bits ?? 0n).toString(),
  });
}

function member(userId: string, roleIds: string[]): MemberInfo {
  return {
    userId,
    username: userId,
    globalName: null,
    displayName: userId,
    avatarUrl: "",
    bot: false,
    joinedAt: null,
    timedOutUntil: null,
    roles: roleIds.map((id) => ({ id, name: id, hexColor: "#000000" })),
  };
}

function role(id: string, position: number): RoleSummary {
  return {
    id,
    name: id,
    color: 0,
    hexColor: "#000000",
    position,
    managed: false,
  };
}

function fakeGateway(over: Partial<BotGateway> = {}): BotGateway {
  return {
    getMember: vi.fn(async () => null),
    listRoles: vi.fn(async () => []),
    ...over,
  } as unknown as BotGateway;
}

beforeEach(() => {
  managedGuilds.clear();
});

describe("actorGuildAuthority + authorityHasCapability", () => {
  it("owner bypasses any capability even with zero bits", async () => {
    setManaged("u1", "g1", { owner: true, bits: 0n });
    const authority = await actorGuildAuthority(session("u1"), "g1");
    expect(authority).toBeDefined();
    expect(authorityHasCapability(authority!, "moderation.ban")).toBe(true);
    expect(authorityHasCapability(authority!, "billing.write")).toBe(true);
  });

  it("Administrator bypasses any capability", async () => {
    setManaged("u1", "g1", { bits: PermissionFlagsBits.Administrator });
    const authority = await actorGuildAuthority(session("u1"), "g1");
    expect(authorityHasCapability(authority!, "roles.write")).toBe(true);
  });

  it("ManageGuild alone does not grant ban/kick/roles (SEC-01)", async () => {
    setManaged("u1", "g1", { bits: PermissionFlagsBits.ManageGuild });
    const authority = await actorGuildAuthority(session("u1"), "g1");
    expect(authorityHasCapability(authority!, "moderation.ban")).toBe(false);
    expect(authorityHasCapability(authority!, "moderation.kick")).toBe(false);
    expect(authorityHasCapability(authority!, "roles.write")).toBe(false);
    // El piso settings.* sí sigue cubierto por ManageGuild (ya lo exige requireGuildAccess).
    expect(authorityHasCapability(authority!, "settings.write")).toBe(true);
  });

  it("the exact permission bit grants exactly that capability", async () => {
    setManaged("u1", "g1", { bits: PermissionFlagsBits.BanMembers });
    const authority = await actorGuildAuthority(session("u1"), "g1");
    expect(authorityHasCapability(authority!, "moderation.ban")).toBe(true);
    expect(authorityHasCapability(authority!, "moderation.kick")).toBe(false);
  });

  it("returns undefined when the actor doesn't manage that guild (no cross-guild leak)", async () => {
    setManaged("u1", "g1", { bits: PermissionFlagsBits.Administrator });
    const authority = await actorGuildAuthority(session("u1"), "g2");
    expect(authority).toBeUndefined();
  });

  it("never crosses users: u2 has no authority from u1's managed guild", async () => {
    setManaged("u1", "g1", { bits: PermissionFlagsBits.Administrator });
    const authority = await actorGuildAuthority(session("u2"), "g1");
    expect(authority).toBeUndefined();
  });
});

describe("assertActorOutranksMember", () => {
  const authorityOf = (opts: { owner?: boolean; administrator?: boolean }) => ({
    owner: opts.owner ?? false,
    administrator: opts.administrator ?? false,
    bits: 0n,
  });

  it("owner bypasses hierarchy without calling the gateway", async () => {
    const gateway = fakeGateway();
    const result = await assertActorOutranksMember(
      gateway,
      authorityOf({ owner: true }),
      "g1",
      "actor",
      "target",
    );
    expect(result.ok).toBe(true);
    expect(gateway.getMember).not.toHaveBeenCalled();
  });

  it("Administrator bypasses hierarchy without calling the gateway", async () => {
    const gateway = fakeGateway();
    const result = await assertActorOutranksMember(
      gateway,
      authorityOf({ administrator: true }),
      "g1",
      "actor",
      "target",
    );
    expect(result.ok).toBe(true);
    expect(gateway.getMember).not.toHaveBeenCalled();
  });

  it("allows the action when the target is not a current member", async () => {
    const gateway = fakeGateway({
      getMember: vi.fn(async (_g: string, userId: string) =>
        userId === "actor" ? member("actor", ["r-low"]) : null,
      ),
      listRoles: vi.fn(async () => [role("r-low", 1)]),
    });
    const result = await assertActorOutranksMember(
      gateway,
      authorityOf({}),
      "g1",
      "actor",
      "target",
    );
    expect(result.ok).toBe(true);
  });

  it("denies when actor and target share the same top role position", async () => {
    const gateway = fakeGateway({
      getMember: vi.fn(async (_g: string, userId: string) =>
        userId === "actor"
          ? member("actor", ["r-mid"])
          : member("target", ["r-mid"]),
      ),
      listRoles: vi.fn(async () => [role("r-mid", 5)]),
    });
    const result = await assertActorOutranksMember(
      gateway,
      authorityOf({}),
      "g1",
      "actor",
      "target",
    );
    expect(result.ok).toBe(false);
  });

  it("denies when the target outranks the actor", async () => {
    const gateway = fakeGateway({
      getMember: vi.fn(async (_g: string, userId: string) =>
        userId === "actor"
          ? member("actor", ["r-low"])
          : member("target", ["r-high"]),
      ),
      listRoles: vi.fn(async () => [role("r-low", 1), role("r-high", 10)]),
    });
    const result = await assertActorOutranksMember(
      gateway,
      authorityOf({}),
      "g1",
      "actor",
      "target",
    );
    expect(result.ok).toBe(false);
  });

  it("allows when the actor clearly outranks the target", async () => {
    const gateway = fakeGateway({
      getMember: vi.fn(async (_g: string, userId: string) =>
        userId === "actor"
          ? member("actor", ["r-high"])
          : member("target", ["r-low"]),
      ),
      listRoles: vi.fn(async () => [role("r-low", 1), role("r-high", 10)]),
    });
    const result = await assertActorOutranksMember(
      gateway,
      authorityOf({}),
      "g1",
      "actor",
      "target",
    );
    expect(result.ok).toBe(true);
  });
});
