import { describe, expect, it } from "vitest";
import { parseShardList } from "./createClient.js";

describe("parseShardList", () => {
  it("rango", () => {
    expect(parseShardList("0-3")).toEqual([0, 1, 2, 3]);
  });
  it("lista", () => {
    expect(parseShardList("0,2,4")).toEqual([0, 2, 4]);
  });
  it("rango + suelto, ordena y deduplica", () => {
    expect(parseShardList("2-4, 7, 3")).toEqual([2, 3, 4, 7]);
  });
  it("rango inverso → null", () => {
    expect(parseShardList("5-2")).toBeNull();
  });
  it("basura → null", () => {
    expect(parseShardList("a")).toBeNull();
    expect(parseShardList("0-")).toBeNull();
  });
  it("vacío → null", () => {
    expect(parseShardList("")).toBeNull();
    expect(parseShardList("  ,  ")).toBeNull();
  });
});
