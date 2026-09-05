import { beforeEach, describe, expect, it, vi } from "vitest";

const claimDueGiveaways = vi.fn();
const addMock = vi.fn();

vi.mock("./domain/giveaways.js", () => ({
  claimDueGiveaways: (...args: unknown[]) => claimDueGiveaways(...args),
  clearGiveawayClaim: vi.fn(),
}));

vi.mock("./actions.js", () => ({
  endGiveawayNow: vi.fn(),
  startGiveawayMessage: vi.fn(),
}));

vi.mock("#core/queue/index.js", () => ({
  defineQueue: () => ({
    add: (...args: unknown[]) => addMock(...args),
    process: vi.fn(),
  }),
}));

const { bindGiveawaysScheduler, processDueGiveaways } = await import(
  "./jobs.js"
);

beforeEach(() => {
  claimDueGiveaways.mockReset();
  addMock.mockReset();
  bindGiveawaysScheduler({ isReady: () => true } as never);
});

describe("processDueGiveaways — jobId estable por transición (JOB-01)", () => {
  it("start y end del mismo id producen jobIds distintos", async () => {
    claimDueGiveaways.mockResolvedValue([
      { id: 3, guildId: "g1", status: "scheduled" },
    ]);
    await processDueGiveaways();
    claimDueGiveaways.mockResolvedValue([
      { id: 3, guildId: "g1", status: "running" },
    ]);
    await processDueGiveaways();
    const jobIds = addMock.mock.calls.map(
      (call) => (call[1] as { jobId: string }).jobId,
    );
    expect(jobIds).toEqual(["giveaway:3:scheduled", "giveaway:3:running"]);
  });

  it("reclamar la misma transición dos veces (lease expirado) deriva el mismo jobId", async () => {
    claimDueGiveaways.mockResolvedValue([
      { id: 8, guildId: "g1", status: "running" },
    ]);
    await processDueGiveaways();
    await processDueGiveaways();
    const jobIds = addMock.mock.calls.map(
      (call) => (call[1] as { jobId: string }).jobId,
    );
    expect(jobIds[0]).toBe(jobIds[1]);
  });
});
