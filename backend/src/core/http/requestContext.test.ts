import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { requestContext, requestIdMiddleware } from "./requestContext.js";

function fakeReq(headerValue?: string): Request {
  return {
    headers: headerValue === undefined ? {} : { "x-request-id": headerValue },
  } as unknown as Request;
}

function fakeRes(): Response & { setHeader: ReturnType<typeof vi.fn> } {
  return { setHeader: vi.fn() } as unknown as Response & {
    setHeader: ReturnType<typeof vi.fn>;
  };
}

describe("requestIdMiddleware", () => {
  it("accepts a well-formed incoming x-request-id and echoes it", () => {
    const req = fakeReq("trace-abc.123_def");
    const res = fakeRes();
    const middleware = requestIdMiddleware();
    middleware(req, res, (() => {
      expect(requestContext.getStore()?.requestId).toBe("trace-abc.123_def");
    }) as never);
    expect(res.setHeader).toHaveBeenCalledWith(
      "x-request-id",
      "trace-abc.123_def",
    );
  });

  it("generates a UUID when there is no incoming header", () => {
    const req = fakeReq(undefined);
    const res = fakeRes();
    requestIdMiddleware()(req, res, (() => {
      const id = requestContext.getStore()?.requestId;
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    }) as never);
  });

  it("rejects an oversized incoming request id (falls back to a UUID)", () => {
    const req = fakeReq("x".repeat(500));
    const res = fakeRes();
    requestIdMiddleware()(req, res, (() => {
      const id = requestContext.getStore()?.requestId;
      expect(id).not.toBe("x".repeat(500));
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    }) as never);
  });

  it("rejects a request id with control characters / newlines (log injection)", () => {
    const req = fakeReq("evil\nline\r\ninjected");
    const res = fakeRes();
    requestIdMiddleware()(req, res, (() => {
      const id = requestContext.getStore()?.requestId;
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    }) as never);
  });
});
