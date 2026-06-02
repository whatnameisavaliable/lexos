import pg from "pg";
import { describe, expect, it } from "vitest";
import { loadAppRuntimeEnv, resolveRepoRoot } from "../config/index.js";

function isDbUrlConfigured(dbUrl: string): boolean {
  return (
    dbUrl.startsWith("postgresql://") &&
    !dbUrl.includes("your-password") &&
    !dbUrl.includes("your-project-ref")
  );
}

describe("M11 ai_invocation_logs.metadata column (integration)", () => {
  it.skipIf(() => {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    return !isDbUrlConfigured(env.supabaseDbUrl);
  })("metadata column exists on ai_invocation_logs", async () => {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    const client = new pg.Client({ connectionString: env.supabaseDbUrl });
    await client.connect();

    try {
      const { rows } = await client.query<{ column_name: string }>(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'ai_invocation_logs'
           AND column_name = 'metadata'`,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.column_name).toBe("metadata");
    } finally {
      await client.end();
    }
  });
});
