import { describe, expect, it } from "vitest";
import { hashSessionId } from "./crypto.js";

describe("hashSessionId (AUTH-01)", () => {
  it("is deterministic for the same input", () => {
    expect(hashSessionId("token-a")).toBe(hashSessionId("token-a"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashSessionId("token-a")).not.toBe(hashSessionId("token-b"));
  });

  it("never returns the raw input (dump-safe)", () => {
    const raw = "super-secret-session-token";
    expect(hashSessionId(raw)).not.toBe(raw);
  });

  it("returns a 64-char lowercase hex sha256 digest", () => {
    expect(hashSessionId("anything")).toMatch(/^[0-9a-f]{64}$/);
  });
});
