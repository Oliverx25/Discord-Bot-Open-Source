import { beforeEach, describe, expect, it, vi } from "vitest";

const claimDueReminders = vi.fn();
const addMock = vi.fn();

vi.mock("./domain/reminders.js", () => ({
  claimDueReminders: (...args: unknown[]) => claimDueReminders(...args),
  bumpReminderAttempt: vi.fn(),
  clearReminderClaim: vi.fn(),
  deleteReminderById: vi.fn(),
  getReminder: vi.fn(),
}));

vi.mock("#core/queue/index.js", () => ({
  defineQueue: () => ({
    add: (...args: unknown[]) => addMock(...args),
    process: vi.fn(),
  }),
}));

const { bindRemindersScheduler, processDueReminders } = await import(
  "./jobs.js"
);

beforeEach(() => {
  claimDueReminders.mockReset();
  addMock.mockReset();
  bindRemindersScheduler({ isReady: () => true } as never);
});

describe("processDueReminders — jobId estable por recordatorio (JOB-01)", () => {
  it("deriva el jobId del id (entrega única)", async () => {
    claimDueReminders.mockResolvedValue([{ id: 5, guildId: "g1" }]);
    await processDueReminders();
    expect(addMock).toHaveBeenCalledWith(
      { id: 5, guildId: "g1" },
      { jobId: "reminder:5" },
    );
  });

  it("reclamar el mismo id dos veces (lease expirado) deriva el mismo jobId", async () => {
    claimDueReminders.mockResolvedValue([{ id: 11, guildId: "g1" }]);
    await processDueReminders();
    await processDueReminders();
    const jobIds = addMock.mock.calls.map(
      (call) => (call[1] as { jobId: string }).jobId,
    );
    expect(jobIds[0]).toBe(jobIds[1]);
  });
});
