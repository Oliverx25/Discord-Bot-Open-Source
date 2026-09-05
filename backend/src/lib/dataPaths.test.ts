import { describe, expect, it } from "vitest";
import { resolvePublicUploadPath, uploadBelongsToGuild } from "./dataPaths.js";

describe("uploadBelongsToGuild (TEN-01)", () => {
  it("accepts a path whose guildId segment matches", () => {
    expect(uploadBelongsToGuild("/uploads/backgrounds/g1/file.png", "g1")).toBe(
      true,
    );
  });

  it("rejects a path belonging to a different guild", () => {
    expect(uploadBelongsToGuild("/uploads/backgrounds/g1/file.png", "g2")).toBe(
      false,
    );
  });

  it("rejects the legacy flat format (no guildId segment at all)", () => {
    expect(uploadBelongsToGuild("/uploads/backgrounds/file.png", "g1")).toBe(
      false,
    );
  });

  it("rejects a path outside /uploads/", () => {
    expect(uploadBelongsToGuild("/etc/passwd", "g1")).toBe(false);
  });

  it("rejects a path with an empty guildId segment", () => {
    expect(uploadBelongsToGuild("/uploads/backgrounds//file.png", "g1")).toBe(
      false,
    );
  });
});

describe("resolvePublicUploadPath", () => {
  it("resolves a well-formed per-tenant path", () => {
    const absolute = resolvePublicUploadPath(
      "/uploads/backgrounds/g1/file.png",
    );
    expect(absolute).not.toBeNull();
    expect(absolute).toMatch(/backgrounds[/\\]g1[/\\]file\.png$/);
  });

  it("rejects path traversal", () => {
    expect(
      resolvePublicUploadPath("/uploads/backgrounds/../../etc/passwd"),
    ).toBeNull();
  });

  it("rejects paths outside /uploads/", () => {
    expect(resolvePublicUploadPath("/etc/passwd")).toBeNull();
  });

  it("rejects an embedded null byte", () => {
    expect(
      resolvePublicUploadPath("/uploads/backgrounds/g1/f\0ile.png"),
    ).toBeNull();
  });
});
