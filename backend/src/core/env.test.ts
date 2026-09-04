import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.js";

function baseEnv(
  role: "api" | "gateway" | "worker",
  overrides: Record<string, string | undefined> = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/adobos",
    REDIS_URL: "redis://localhost:6379",
    SESSION_SECRET: "a".repeat(32),
    PUBLIC_APP_URL: "http://localhost:3000",
    DISCORD_CLIENT_ID: "client-id",
    DISCORD_CLIENT_SECRET: "client-secret",
    DISCORD_TOKEN: "bot-token",
    ADOBO_ROLE: role,
    ...overrides,
  } as NodeJS.ProcessEnv;
}

const roles = ["api", "gateway", "worker"] as const;

describe("parseEnv", () => {
  it("accepts a minimal valid configuration for api, gateway and worker", () => {
    for (const role of roles) {
      const cfg = parseEnv(baseEnv(role));
      expect(cfg.ADOBO_ROLE).toBe(role);
      expect(cfg.REDIS_URL).toBe("redis://localhost:6379");
      expect(cfg.DISCORD_TOKEN).toBe("bot-token");
    }
  });

  it("fails when ADOBO_ROLE is missing", () => {
    const env = baseEnv("api");
    delete (env as Record<string, unknown>).ADOBO_ROLE;
    expect(() => parseEnv(env)).toThrow(/ADOBO_ROLE/);
  });

  it("fails with the new allowed-values message when ADOBO_ROLE=all", () => {
    expect(() => parseEnv(baseEnv("api", { ADOBO_ROLE: "all" }))).toThrow(
      /Use api \| gateway \| worker/,
    );
  });

  it.each(roles)("fails when REDIS_URL is missing for role %s", (role) => {
    const env = baseEnv(role);
    delete (env as Record<string, unknown>).REDIS_URL;
    expect(() => parseEnv(env)).toThrow(/REDIS_URL/);
  });

  it.each(roles)(
    "fails with an invalid REDIS_URL scheme for role %s",
    (role) => {
      expect(() =>
        parseEnv(baseEnv(role, { REDIS_URL: "http://localhost:6379" })),
      ).toThrow(/REDIS_URL/);
    },
  );

  it.each(roles)("fails when DISCORD_TOKEN is missing for role %s", (role) => {
    const env = baseEnv(role);
    delete (env as Record<string, unknown>).DISCORD_TOKEN;
    expect(() => parseEnv(env)).toThrow(/DISCORD_TOKEN/);
  });

  it("fails when DISCORD_CLIENT_SECRET equals DISCORD_TOKEN", () => {
    expect(() =>
      parseEnv(
        baseEnv("api", {
          DISCORD_CLIENT_SECRET: "same-value",
          DISCORD_TOKEN: "same-value",
        }),
      ),
    ).toThrow(/DISCORD_CLIENT_SECRET/);
  });

  it("fails when CORS_ORIGIN is missing in production", () => {
    expect(() => parseEnv(baseEnv("api", { NODE_ENV: "production" }))).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it("accepts production with CORS_ORIGIN set", () => {
    const cfg = parseEnv(
      baseEnv("api", {
        NODE_ENV: "production",
        CORS_ORIGIN: "https://panel.example.com",
      }),
    );
    expect(cfg.CORS_ORIGIN).toBe("https://panel.example.com");
  });
});
