import { describe, expect, it } from "vitest";
import {
  BILLING_PLAN_PRICES,
  guildCoveredByOtherPayer,
  isPaidSubscriptionStatus,
  isSubscriptionStatus,
} from "./billing.js";

describe("precios Billing", () => {
  it("ancla 4,99€ / 14,99€", () => {
    expect(BILLING_PLAN_PRICES.pro.monthlyEur).toBe(4.99);
    expect(BILLING_PLAN_PRICES.pro.label).toBe("4,99€/mes");
    expect(BILLING_PLAN_PRICES.business.monthlyEur).toBe(14.99);
    expect(BILLING_PLAN_PRICES.business.label).toBe("14,99€/mes");
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
