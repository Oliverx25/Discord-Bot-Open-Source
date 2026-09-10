import { afterEach, describe, expect, it } from "vitest";
import { sessionCookieName } from "./types.js";

const ORIGINAL_URL = process.env.PUBLIC_APP_URL;

describe("sessionCookieName", () => {
  afterEach(() => {
    if (ORIGINAL_URL === undefined) delete process.env.PUBLIC_APP_URL;
    else process.env.PUBLIC_APP_URL = ORIGINAL_URL;
  });

  it("uses tobot_session on http origins", () => {
    process.env.PUBLIC_APP_URL = "http://localhost:4321";
    expect(sessionCookieName()).toBe("tobot_session");
  });

  it("uses the __Host- prefix on https same-host origins", () => {
    process.env.PUBLIC_APP_URL = "https://tobot.gg";
    expect(sessionCookieName()).toBe("__Host-tobot_session");
  });
});
