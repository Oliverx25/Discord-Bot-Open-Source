import { beforeEach, describe, expect, it, vi } from "vitest";

const claimDueScheduledMessages = vi.fn();
const addMock = vi.fn();

vi.mock("./domain/scheduled-messages.js", () => ({
  claimDueScheduledMessages: (...args: unknown[]) =>
    claimDueScheduledMessages(...args),
  applyScheduledMessageTick: vi.fn(),
  backfillScheduledNextRuns: vi.fn(),
  getScheduledMessage: vi.fn(),
  nextRunAfterSend: vi.fn(),
  ScheduledMessagesError: class extends Error {},
}));

vi.mock("#core/queue/index.js", () => ({
  defineQueue: () => ({
    add: (...args: unknown[]) => addMock(...args),
    process: vi.fn(),
  }),
}));

const { bindScheduledMessagesScheduler, processDueScheduledMessages } =
  await import("./jobs.js");

beforeEach(() => {
  claimDueScheduledMessages.mockReset();
  addMock.mockReset();
  bindScheduledMessagesScheduler({ isReady: () => true } as never);
});

describe("processDueScheduledMessages — jobId estable por ocurrencia (JOB-01)", () => {
  it("deriva el jobId de id + next_run_at reclamado", async () => {
    claimDueScheduledMessages.mockResolvedValue([
      { id: 42, guildId: "g1", nextRunAt: "2026-01-01T00:00:00.000Z" },
    ]);
    await processDueScheduledMessages();
    expect(addMock).toHaveBeenCalledWith(
      { id: 42, guildId: "g1" },
      { jobId: "scheduled-message:42:2026-01-01T00:00:00.000Z" },
    );
  });

  it("dos ocurrencias distintas del mismo id producen jobIds distintos", async () => {
    claimDueScheduledMessages.mockResolvedValue([
      { id: 7, guildId: "g1", nextRunAt: "2026-01-01T00:00:00.000Z" },
    ]);
    await processDueScheduledMessages();
    claimDueScheduledMessages.mockResolvedValue([
      { id: 7, guildId: "g1", nextRunAt: "2026-01-02T00:00:00.000Z" },
    ]);
    await processDueScheduledMessages();
    const jobIds = addMock.mock.calls.map(
      (call) => (call[1] as { jobId: string }).jobId,
    );
    expect(new Set(jobIds).size).toBe(2);
  });

  it("la misma ocurrencia reclamada dos veces (lease expirado) deriva el mismo jobId", async () => {
    claimDueScheduledMessages.mockResolvedValue([
      { id: 9, guildId: "g1", nextRunAt: "2026-01-01T00:00:00.000Z" },
    ]);
    await processDueScheduledMessages();
    await processDueScheduledMessages();
    const jobIds = addMock.mock.calls.map(
      (call) => (call[1] as { jobId: string }).jobId,
    );
    expect(jobIds[0]).toBe(jobIds[1]);
  });
});
