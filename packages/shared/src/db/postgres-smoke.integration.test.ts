import { describe, expect, it } from "vitest";
import { loadAppRuntimeEnv, resolveRepoRoot } from "../config/index.js";
import { assertPostgresSelectOne } from "./postgres-smoke.js";

function isDbUrlConfigured(dbUrl: string): boolean {
  return (
    dbUrl.startsWith("postgresql://") &&
    !dbUrl.includes("your-password") &&
    !dbUrl.includes("your-project-ref")
  );
}

describe("Postgres SELECT 1 smoke (integration)", () => {
  it.skipIf(() => {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    return !isDbUrlConfigured(env.supabaseDbUrl);
  })("connects using SUPABASE_DB_URL", async () => {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    const result = await assertPostgresSelectOne(env.supabaseDbUrl);
    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
