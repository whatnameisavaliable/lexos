import { describe, expect, it } from "vitest";
import pg from "pg";
import { loadAppRuntimeEnv, resolveRepoRoot } from "@lexos/shared/config";

function isDbUrlConfigured(dbUrl: string): boolean {
  return (
    dbUrl.startsWith("postgresql://") &&
    !dbUrl.includes("your-password") &&
    !dbUrl.includes("your-project-ref")
  );
}

describe("complete_password_change() RPC (integration)", () => {
  it.skipIf(() => {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    return !isDbUrlConfigured(env.supabaseDbUrl);
  })("function exists in public schema", async () => {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    const client = new pg.Client({ connectionString: env.supabaseDbUrl });
    await client.connect();
    try {
      const { rows } = await client.query<{ proname: string }>(
        `SELECT proname FROM pg_proc
         JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
         WHERE nspname = 'public' AND proname = 'complete_password_change'`,
      );
      expect(rows.length).toBe(1);
    } finally {
      await client.end();
    }
  });
});
