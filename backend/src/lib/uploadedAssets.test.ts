import { beforeEach, describe, expect, it, vi } from "vitest";

const selectResult = { n: 0, bytes: 0 };

vi.mock("#db/client.js", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ ...selectResult }]),
      }),
    }),
  }),
}));

const { assertUploadQuota } = await import("./uploadedAssets.js");

beforeEach(() => {
  selectResult.n = 0;
  selectResult.bytes = 0;
});

describe("assertUploadQuota (TEN-01)", () => {
  it("allows an upload well under both limits", async () => {
    selectResult.n = 5;
    selectResult.bytes = 1024;
    await expect(assertUploadQuota("g1", 1024)).resolves.toBeUndefined();
  });

  it("rejects once the per-guild file count limit is reached", async () => {
    selectResult.n = 200;
    selectResult.bytes = 0;
    await expect(assertUploadQuota("g1", 10)).rejects.toMatchObject({
      code: "UPLOAD_QUOTA_EXCEEDED",
    });
  });

  it("rejects once the per-guild byte limit would be exceeded", async () => {
    selectResult.n = 1;
    selectResult.bytes = 100 * 1024 * 1024 - 100;
    await expect(assertUploadQuota("g1", 1000)).rejects.toMatchObject({
      code: "UPLOAD_QUOTA_EXCEEDED",
    });
  });

  it("allows an upload that exactly fills remaining byte quota", async () => {
    selectResult.n = 1;
    selectResult.bytes = 100 * 1024 * 1024 - 1000;
    await expect(assertUploadQuota("g1", 1000)).resolves.toBeUndefined();
  });
});
