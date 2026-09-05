import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

let corsOrigin: string | undefined;
let publicAppUrl: string;

vi.mock("../env.js", () => ({
  env: () => ({
    CORS_ORIGIN: corsOrigin,
    PUBLIC_APP_URL: publicAppUrl,
    NODE_ENV: "production",
    CSP_REPORT_ONLY: undefined,
  }),
}));

const { allowedOrigins, requireTrustedOrigin } = await import("./createApp.js");

beforeEach(() => {
  corsOrigin = "https://panel.example.com,https://admin.example.com";
  publicAppUrl = "https://panel.example.com";
});

function callMiddleware(
  method: string,
  origin: string | undefined,
): { status: number; body: unknown; nextCalled: boolean } {
  const req = { method, headers: { origin } } as unknown as Request;
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
  let nextCalled = false;
  requireTrustedOrigin()(req, res, () => {
    nextCalled = true;
  });
  return { status, body, nextCalled };
}

describe("allowedOrigins (AUTH-01)", () => {
  it("parses the comma-separated CORS_ORIGIN list", () => {
    expect(allowedOrigins()).toEqual([
      "https://panel.example.com",
      "https://admin.example.com",
    ]);
  });

  it("falls back to PUBLIC_APP_URL when CORS_ORIGIN is unset", () => {
    corsOrigin = undefined;
    publicAppUrl = "https://fallback.example.com/";
    expect(allowedOrigins()).toEqual(["https://fallback.example.com"]);
  });
});

describe("requireTrustedOrigin (CSRF defense-in-depth)", () => {
  it("passes through non-mutating methods regardless of Origin", () => {
    const result = callMiddleware("GET", "https://evil.example.com");
    expect(result.nextCalled).toBe(true);
  });

  it("passes through a mutation with no Origin header (sameSite=lax is the primary defense)", () => {
    const result = callMiddleware("POST", undefined);
    expect(result.nextCalled).toBe(true);
  });

  it("allows a mutation from an allowlisted Origin", () => {
    const result = callMiddleware("POST", "https://panel.example.com");
    expect(result.nextCalled).toBe(true);
  });

  it("blocks a mutation from a cross-origin Origin", () => {
    const result = callMiddleware("DELETE", "https://evil.example.com");
    expect(result.nextCalled).toBe(false);
    expect(result.status).toBe(403);
    expect((result.body as { code?: string })?.code).toBe(
      "CSRF_ORIGIN_MISMATCH",
    );
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "blocks %s from an untrusted origin",
    (method) => {
      const result = callMiddleware(method, "https://evil.example.com");
      expect(result.status).toBe(403);
    },
  );
});
