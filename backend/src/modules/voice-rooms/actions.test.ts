import type { VoiceRoomGenerator, VoiceRoomLive } from "@adobos/shared";
import { describe, expect, it, vi } from "vitest";

/**
 * Fase 7 (MAINT-01): `runVoiceRoomAction` no tenía tests — se agregan acá al
 * dividir el switch monolítico original en handlers por acción, uno por
 * `VoiceRoomAction` (+ unlock/unghost), para dejar la refactorización
 * cubierta por regresión real, no solo typecheck.
 */

const assertCanControl = vi.fn();
const applyLock = vi.fn(async () => {});
const applyGhost = vi.fn(async () => {});
const setRoomName = vi.fn(async () => {});
const setRoomLimit = vi.fn(async () => {});
const setRoomBitrate = vi.fn(async () => {});
const setRoomStatus = vi.fn(async () => {});
const permitTarget = vi.fn(async () => {});
const rejectTarget = vi.fn(async () => {});
const transferOwnerOverwrites = vi.fn(async () => {});
const createInviteUrl = vi.fn(async () => "https://discord.gg/abc");
const ensureTextChannel = vi.fn(async () => "999999999999999999");

vi.mock("./rooms.js", () => ({
  assertCanControl: (...args: unknown[]) => assertCanControl(...args),
  applyLock: (...args: unknown[]) => applyLock(...args),
  applyGhost: (...args: unknown[]) => applyGhost(...args),
  setRoomName: (...args: unknown[]) => setRoomName(...args),
  setRoomLimit: (...args: unknown[]) => setRoomLimit(...args),
  setRoomBitrate: (...args: unknown[]) => setRoomBitrate(...args),
  setRoomStatus: (...args: unknown[]) => setRoomStatus(...args),
  permitTarget: (...args: unknown[]) => permitTarget(...args),
  rejectTarget: (...args: unknown[]) => rejectTarget(...args),
  transferOwnerOverwrites: (...args: unknown[]) =>
    transferOwnerOverwrites(...args),
  createInviteUrl: (...args: unknown[]) => createInviteUrl(...args),
  ensureTextChannel: (...args: unknown[]) => ensureTextChannel(...args),
  fetchVoiceChannel: vi.fn(),
}));

const patchRoom = vi.fn(async () => null);
const getRoomByOwner = vi.fn(async () => null);

vi.mock("./domain/voice-rooms.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./domain/voice-rooms.js")>();
  return {
    ...actual,
    patchRoom: (...args: unknown[]) => patchRoom(...args),
    getRoomByOwner: (...args: unknown[]) => getRoomByOwner(...args),
  };
});

const { runVoiceRoomAction } = await import("./actions.js");

const ROOM: VoiceRoomLive = {
  channelId: "333333333333333333",
  guildId: "111111111111111111",
  generatorId: 1,
  ownerId: "222222222222222222",
  textChannelId: null,
  locked: false,
  ghosted: false,
  createdAt: new Date().toISOString(),
};

const GENERATOR = {
  allowedActions: {},
} as unknown as VoiceRoomGenerator;

function fakeMember(id = "222222222222222222") {
  return { id, client: { users: { fetch: vi.fn() } } } as unknown as Parameters<
    typeof runVoiceRoomAction
  >[0]["member"];
}

function fakeChannel(overrides: Record<string, unknown> = {}) {
  return {
    members: { has: () => true },
    guild: { maximumBitrate: 384_000 },
    ...overrides,
  } as unknown as Parameters<typeof runVoiceRoomAction>[0]["channel"];
}

describe("runVoiceRoomAction", () => {
  it("name: sanitizes and applies the new name", async () => {
    const message = await runVoiceRoomAction({
      member: fakeMember(),
      room: ROOM,
      generator: GENERATOR,
      channel: fakeChannel(),
      action: "name",
      name: "My Room",
    });
    expect(setRoomName).toHaveBeenCalled();
    expect(message).toContain("My Room");
  });

  it("lock/unlock: toggles the lock and persists it on the room row", async () => {
    await runVoiceRoomAction({
      member: fakeMember(),
      room: ROOM,
      generator: GENERATOR,
      channel: fakeChannel(),
      action: "lock",
    });
    expect(applyLock).toHaveBeenCalledWith(expect.anything(), true);
    expect(patchRoom).toHaveBeenCalledWith(ROOM.channelId, { locked: true });

    await runVoiceRoomAction({
      member: fakeMember(),
      room: ROOM,
      generator: GENERATOR,
      channel: fakeChannel(),
      action: "unlock",
    });
    expect(applyLock).toHaveBeenCalledWith(expect.anything(), false);
    expect(patchRoom).toHaveBeenCalledWith(ROOM.channelId, { locked: false });
  });

  it("permit: requires a user or role target", async () => {
    await expect(
      runVoiceRoomAction({
        member: fakeMember(),
        room: ROOM,
        generator: GENERATOR,
        channel: fakeChannel(),
        action: "permit",
      }),
    ).rejects.toMatchObject({ code: "MISSING_TARGET" });
    expect(permitTarget).not.toHaveBeenCalled();
  });

  it("transfer: rejects when the target already owns a room", async () => {
    getRoomByOwner.mockResolvedValueOnce({} as never);
    await expect(
      runVoiceRoomAction({
        member: fakeMember(),
        room: ROOM,
        generator: GENERATOR,
        channel: fakeChannel(),
        action: "transfer",
        targetUserId: "444444444444444444",
      }),
    ).rejects.toMatchObject({ code: "ALREADY_HAS_ROOM" });
    expect(transferOwnerOverwrites).not.toHaveBeenCalled();
  });

  it("transfer: moves ownership when the target is free and in the room", async () => {
    getRoomByOwner.mockResolvedValueOnce(null);
    const message = await runVoiceRoomAction({
      member: fakeMember(),
      room: ROOM,
      generator: GENERATOR,
      channel: fakeChannel(),
      action: "transfer",
      targetUserId: "444444444444444444",
    });
    expect(transferOwnerOverwrites).toHaveBeenCalledWith(
      expect.anything(),
      ROOM.ownerId,
      "444444444444444444",
    );
    expect(message).toContain("444444444444444444");
  });

  it("claim: rejected while the owner is still in the room", async () => {
    await expect(
      runVoiceRoomAction({
        member: fakeMember("555555555555555555"),
        room: ROOM,
        generator: GENERATOR,
        channel: fakeChannel({ members: { has: () => true } }),
        action: "claim",
      }),
    ).rejects.toMatchObject({ code: "OWNER_PRESENT" });
  });

  it("unknown action: throws UNKNOWN_ACTION", async () => {
    await expect(
      runVoiceRoomAction({
        member: fakeMember(),
        room: ROOM,
        generator: GENERATOR,
        channel: fakeChannel(),
        // @ts-expect-error deliberately invalid for this test
        action: "does-not-exist",
      }),
    ).rejects.toMatchObject({ code: "UNKNOWN_ACTION" });
  });
});
