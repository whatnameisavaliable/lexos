import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSupabaseEnv, resolveRepoRoot } from "./env.js";
import {
  assertLinkedProjectMatchesEnv,
  parseProjectRefFromSupabaseUrl,
  readLinkedProjectRef,
} from "./supabase-project.js";

describe("parseProjectRefFromSupabaseUrl", () => {
  it("extracts ref from standard cloud URL", () => {
    expect(
      parseProjectRefFromSupabaseUrl(
        "https://fippbvkcdjcdxninztmr.supabase.co",
      ),
    ).toBe("fippbvkcdjcdxninztmr");
  });
});

describe("supabase link (integration)", () => {
  it("linked project-ref matches SUPABASE_URL", () => {
    const repoRoot = resolveRepoRoot();
    const configPath = path.join(repoRoot, "supabase", "config.toml");
    expect(fs.existsSync(configPath)).toBe(true);

    const env = loadSupabaseEnv(repoRoot);
    const linkedRef = readLinkedProjectRef(repoRoot);
    assertLinkedProjectMatchesEnv(env.supabaseUrl, linkedRef);
    expect(linkedRef).toBe("fippbvkcdjcdxninztmr");
  });
});
