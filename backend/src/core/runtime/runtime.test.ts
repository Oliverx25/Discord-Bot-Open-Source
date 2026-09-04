import { describe, expect, it } from "vitest";
import {
  isAdobosRole,
  roleRunsGateway,
  roleRunsHttp,
  roleRunsWorker,
} from "./index.js";

describe("ADOBO_ROLE", () => {
  it("accepts exactly the three split roles", () => {
    expect(isAdobosRole("api")).toBe(true);
    expect(isAdobosRole("gateway")).toBe(true);
    expect(isAdobosRole("worker")).toBe(true);
  });

  it("rejects the removed all role, empty, uppercase, spaces and unknown values", () => {
    expect(isAdobosRole("all")).toBe(false);
    expect(isAdobosRole("")).toBe(false);
    expect(isAdobosRole("API")).toBe(false);
    expect(isAdobosRole("Gateway")).toBe(false);
    expect(isAdobosRole(" api")).toBe(false);
    expect(isAdobosRole("api ")).toBe(false);
    expect(isAdobosRole("bot")).toBe(false);
  });

  it.each([
    { role: "api", http: true, gateway: false, worker: false },
    { role: "gateway", http: false, gateway: true, worker: false },
    { role: "worker", http: false, gateway: false, worker: true },
  ] as const)(
    "$role activates exactly one phase (http=$http, gateway=$gateway, worker=$worker)",
    ({ role, http, gateway, worker }) => {
      expect(roleRunsHttp(role)).toBe(http);
      expect(roleRunsGateway(role)).toBe(gateway);
      expect(roleRunsWorker(role)).toBe(worker);
    },
  );
});
