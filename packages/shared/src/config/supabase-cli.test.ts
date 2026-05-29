import { describe, expect, it } from "vitest";
import {
  assertSupabaseCliInstalled,
  getSupabaseCliVersion,
  resolveSupabaseCli,
} from "./supabase-cli.js";

describe("resolveSupabaseCli", () => {
  it("uses global supabase on win32", () => {
    const original = process.platform;
    Object.defineProperty(process, "platform", { value: "win32" });
    expect(resolveSupabaseCli()).toEqual({ command: "supabase", args: [] });
    Object.defineProperty(process, "platform", { value: original });
  });
});

describe("getSupabaseCliVersion (mocked)", () => {
  it("returns trimmed version from injected exec runner", () => {
    expect(
      getSupabaseCliVersion(
        { command: "supabase", args: [] },
        {
          execFileSync: () => "2.101.0\n",
          execSync: () => "",
        },
      ),
    ).toBe("2.101.0");
  });
});

describe("Supabase CLI (integration)", () => {
  it("assertSupabaseCliInstalled returns semver-like output", () => {
    const version = assertSupabaseCliInstalled();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
