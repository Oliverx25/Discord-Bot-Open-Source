import { describe, expect, it } from "vitest";
import {
  BILLING_PLAN_PRICES,
  formatUsd,
  guildCoveredByOtherPayer,
  isPaidSubscriptionStatus,
  isSubscriptionStatus,
} from "./billing.js";

describe("precios Billing", () => {
  it("ancla $4.99 / $14.99", () => {
    expect(BILLING_PLAN_PRICES.pro.monthlyUsd).toBe(4.99);
    expect(BILLING_PLAN_PRICES.pro.label).toBe("$4.99/mo");
    expect(BILLING_PLAN_PRICES.business.monthlyUsd).toBe(14.99);
    expect(BILLING_PLAN_PRICES.business.label).toBe("$14.99/mo");
    expect(formatUsd(4.99)).toBe("$4.99");
    expect(formatUsd(51)).toBe("$51");
  });
});

describe("paused sigue pagado", () => {
  it("paused is a paid status", () => {
    expect(isSubscriptionStatus("paused")).toBe(true);
    expect(isPaidSubscriptionStatus("paused")).toBe(true);
    expect(isPaidSubscriptionStatus("canceled")).toBe(false);
  });
});

describe("otro pagador", () => {
  it("409 if another payer covers the guild", () => {
    expect(
      guildCoveredByOtherPayer("u1", { userId: "u2", status: "paused" }),
    ).toBe(true);
    expect(
      guildCoveredByOtherPayer("u1", { userId: "u1", status: "active" }),
    ).toBe(false);
    expect(
      guildCoveredByOtherPayer("u1", { userId: "u2", status: "canceled" }),
    ).toBe(false);
    expect(guildCoveredByOtherPayer("u1", null)).toBe(false);
  });
});
