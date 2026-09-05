import type { Request, Response, Router } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BotGateway } from "#core/discord/botGateway.js";

const pingDatabaseMock = vi.fn();
const pingRedisMock = vi.fn();
const activeQueueWorkerNamesMock = vi.fn();
const isWorkerLeaderMock = vi.fn();
let role: "api" | "gateway" | "worker" = "api";

vi.mock("#db/client.js", () => ({
  pingDatabase: (...args: unknown[]) => pingDatabaseMock(...args),
}));
vi.mock("#core/cache/redis.js", () => ({
  pingRedis: (...args: unknown[]) => pingRedisMock(...args),
}));
vi.mock("#core/queue/index.js", () => ({
  activeQueueWorkerNames: (...args: unknown[]) =>
    activeQueueWorkerNamesMock(...args),
}));
vi.mock("#core/runtime/index.js", () => ({
  runtimeRole: () => role,
  roleRunsGateway: (r: string) => r === "gateway",
  roleRunsWorker: (r: string) => r === "worker",
  isWorkerLeader: (...args: unknown[]) => isWorkerLeaderMock(...args),
}));

const { healthRouter } = await import("./health.js");

function fakeGateway(isReady: boolean): BotGateway {
  return { isReady: () => isReady } as unknown as BotGateway;
}

async function callReady(
  gateway: BotGateway,
): Promise<{ status: number; body: unknown }> {
  const router = healthRouter(gateway) as Router & {
    stack: Array<{
      route?: {
        path: string;
        stack: Array<{
          handle: (req: Request, res: Response) => unknown;
        }>;
      };
    }>;
  };
  const layer = router.stack.find((l) => l.route?.path === "/ready");
  const handler = layer?.route?.stack[0]?.handle;
  if (!handler) throw new Error("/ready handler not found");

  let status = 200;
  let body: unknown;
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as Response;

  await handler({} as Request, res);
  return { status, body };
}

beforeEach(() => {
  pingDatabaseMock.mockReset().mockResolvedValue(true);
  pingRedisMock.mockReset().mockResolvedValue(true);
  activeQueueWorkerNamesMock.mockReset().mockReturnValue(["reminders"]);
  isWorkerLeaderMock.mockReset().mockReturnValue(false);
  role = "api";
});

describe("GET /ready — readiness por rol (OPS-02)", () => {
  it("api: ok con postgres+redis, discord y queueConsumers 'skipped'", async () => {
    role = "api";
    const { status, body } = await callReady(fakeGateway(false));
    expect(status).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
      role: "api",
      postgres: true,
      redis: true,
      discord: "skipped",
      queueConsumers: "skipped",
      leader: "skipped",
    });
  });

  it("api: degraded si Redis no responde (antes esto pasaba readiness)", async () => {
    role = "api";
    pingRedisMock.mockResolvedValue(false);
    const { status, body } = await callReady(fakeGateway(false));
    expect(status).toBe(503);
    expect((body as { status: string }).status).toBe("degraded");
  });

  it("gateway: exige Client vivo además de postgres+redis", async () => {
    role = "gateway";
    const { status } = await callReady(fakeGateway(false));
    expect(status).toBe(503);

    const ready = await callReady(fakeGateway(true));
    expect(ready.status).toBe(200);
    expect((ready.body as { discord: unknown }).discord).toBe(true);
  });

  it("worker: exige al menos un consumidor BullMQ activo", async () => {
    role = "worker";
    activeQueueWorkerNamesMock.mockReturnValue([]);
    const { status, body } = await callReady(fakeGateway(false));
    expect(status).toBe(503);
    expect((body as { queueConsumers: unknown }).queueConsumers).toBe(false);
  });

  it("worker: standby (no líder) sigue 'ok' — ser standby es normal", async () => {
    role = "worker";
    isWorkerLeaderMock.mockReturnValue(false);
    activeQueueWorkerNamesMock.mockReturnValue(["reminders", "giveaways"]);
    const { status, body } = await callReady(fakeGateway(false));
    expect(status).toBe(200);
    expect((body as { leader: unknown }).leader).toBe(false);
  });
});
