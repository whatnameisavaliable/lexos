import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertSupabaseLayout,
  getSupabaseLayoutPaths,
} from "./supabase-layout.js";

describe("Supabase directory layout (M0-A)", () => {
  it("has migrations/ and seed.sql", () => {
    expect(() => assertSupabaseLayout()).not.toThrow();
    const paths = getSupabaseLayoutPaths();
    expect(fs.readFileSync(paths.seedFile, "utf8")).toContain("LexOS seed");
  });
});
