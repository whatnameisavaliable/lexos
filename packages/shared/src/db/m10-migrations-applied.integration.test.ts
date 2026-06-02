import pg from "pg";
import { describe, expect, it } from "vitest";
import { loadAppRuntimeEnv, resolveRepoRoot } from "../config/index.js";

const SOP_TABLES = [
  "sop_templates",
  "sop_template_versions",
  "sop_steps",
  "case_pipelines",
  "pipeline_artifacts",
] as const;

function isDbUrlConfigured(dbUrl: string): boolean {
  return (
    dbUrl.startsWith("postgresql://") &&
    !dbUrl.includes("your-password") &&
    !dbUrl.includes("your-project-ref")
  );
}

describe("M10 migrations applied (integration)", () => {
  it.skipIf(() => {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    return !isDbUrlConfigured(env.supabaseDbUrl);
  })("SOP tables exist in information_schema", async () => {
    const env = loadAppRuntimeEnv(resolveRepoRoot());
    const client = new pg.Client({ connectionString: env.supabaseDbUrl });
    await client.connect();

    try {
      for (const table of SOP_TABLES) {
        const { rows } = await client.query<{ exists: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = $1
           ) AS exists`,
          [table],
        );
        expect(rows[0]?.exists).toBe(true);
      }
    } finally {
      await client.end();
    }
  });
});
