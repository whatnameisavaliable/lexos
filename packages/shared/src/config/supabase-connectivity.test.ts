import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSupabaseEnv, resolveRepoRoot } from "./env.js";
import {
  assertSupabaseReachable,
  probeSupabaseRest,
} from "./supabase-connectivity.js";

describe("probeSupabaseRest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("treats 200 and 404 as reachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
    const result = await probeSupabaseRest({
      supabaseUrl: "https://proj.supabase.co",
      supabaseAnonKey: "key",
    });
    expect(result.ok).toBe(true);
    expect(result.url).toContain("/auth/v1/health");
  });
});

describe("Supabase remote connectivity (integration)", () => {
  it("loads .env.development and reaches remote REST", async () => {
    const repoRoot = resolveRepoRoot();
    const config = loadSupabaseEnv(repoRoot);
    expect(config.supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co\/?$/);

    const result = await assertSupabaseReachable(config);
    expect(result.ok).toBe(true);
  });
});
