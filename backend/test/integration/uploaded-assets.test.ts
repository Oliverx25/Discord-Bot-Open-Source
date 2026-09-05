import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { closeTestDb, connectTestDb } from "./support/db.js";

/**
 * TEN-01 (PLAN_FINAL_2026.md, §12.4): `assertUploadQuota` ya se prueba
 * mockeada (backend/src/lib/uploadedAssets.test.ts) — esto prueba que el
 * INSERT/DELETE reales compilan y corren contra Postgres (nombres de
 * columna, la FK a `guild_settings`), no solo que el código llama a
 * Drizzle con la forma correcta.
 */

let recordUploadedAsset: (input: {
  guildId: string;
  ownerId: string;
  kind: "backgrounds" | "images" | "templates";
  filename: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
}) => Promise<void>;
let deleteUploadedAsset: (
  kind: "backgrounds" | "images" | "templates",
  guildId: string,
  filename: string,
) => Promise<boolean>;
let getDb: () => {
  insert: (t: unknown) => { values: (v: unknown) => Promise<unknown> };
  delete: (t: unknown) => { where: (w: unknown) => Promise<unknown> };
  select: () => {
    from: (t: unknown) => { where: (w: unknown) => Promise<unknown[]> };
  };
};
let guildSettings: unknown;
let uploadedAssets: unknown;

const testGuildId = `test_${randomUUID().replaceAll("-", "")}`;
let tmpFilePath: string;

beforeAll(async () => {
  await connectTestDb();
  const lib = await import("#lib/uploadedAssets.js");
  recordUploadedAsset = lib.recordUploadedAsset;
  deleteUploadedAsset = lib.deleteUploadedAsset;
  const client = await import("#db/client.js");
  getDb = client.getDb;
  const schema = await import("#db/schema.js");
  guildSettings = schema.guildSettings;
  uploadedAssets = schema.uploadedAssets;

  // FK: uploaded_assets.guild_id -> guild_settings.guild_id.
  await getDb()
    .insert(guildSettings)
    .values({ guildId: testGuildId, prefix: "!", welcomeEnabled: false });

  tmpFilePath = path.join(os.tmpdir(), `adobos-test-${randomUUID()}.png`);
  fs.writeFileSync(tmpFilePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
}, 30_000);

afterAll(async () => {
  fs.rmSync(tmpFilePath, { force: true });
  await getDb().delete(guildSettings).where(eq(guildSettings.guildId, testGuildId));
  await closeTestDb();
});

afterEach(async () => {
  await getDb().delete(uploadedAssets).where(eq(uploadedAssets.guildId, testGuildId));
});

describe("recordUploadedAsset / deleteUploadedAsset — contra Postgres real (TEN-01)", () => {
  it("inserta la fila con el sha256 calculado del archivo real", async () => {
    await recordUploadedAsset({
      guildId: testGuildId,
      ownerId: "u1",
      kind: "images",
      filename: "file.png",
      mimeType: "image/png",
      sizeBytes: 4,
      filePath: tmpFilePath,
    });

    const rows = (await getDb()
      .select()
      .from(uploadedAssets)
      .where(eq(uploadedAssets.guildId, testGuildId))) as Array<{
      filename: string;
      sha256: string;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.filename).toBe("file.png");
    expect(rows[0]?.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("delete devuelve false para un archivo que no es de ese guild", async () => {
    const deleted = await deleteUploadedAsset(
      "images",
      testGuildId,
      "never-uploaded.png",
    );
    expect(deleted).toBe(false);
  });

  it("delete borra la fila cuando existe", async () => {
    await recordUploadedAsset({
      guildId: testGuildId,
      ownerId: "u1",
      kind: "images",
      filename: "to-delete.png",
      mimeType: "image/png",
      sizeBytes: 4,
      filePath: tmpFilePath,
    });
    const deleted = await deleteUploadedAsset(
      "images",
      testGuildId,
      "to-delete.png",
    );
    expect(deleted).toBe(true);

    const rows = await getDb()
      .select()
      .from(uploadedAssets)
      .where(eq(uploadedAssets.guildId, testGuildId));
    expect(rows).toHaveLength(0);
  });
});
