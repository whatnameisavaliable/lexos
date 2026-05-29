import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { resolveRepoRoot } from "../config/env.js";

/** 已登记迁移文件名（含 `.sql`），按时间戳排序。 */
export function listMigrationSqlFiles(
  repoRoot: string = resolveRepoRoot(),
): readonly string[] {
  const dir = path.join(repoRoot, "supabase", "migrations");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

/**
 * 迁移版本号（文件名去掉 `.sql`，与 Supabase CLI 一致）。
 */
export function migrationVersionFromFileName(fileName: string): string {
  return fileName.replace(/\.sql$/i, "");
}

async function ensureMigrationTable(client: pg.Client): Promise<void> {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      statements text[],
      name text
    );
  `);
}

async function loadAppliedVersions(client: pg.Client): Promise<Set<string>> {
  const { rows } = await client.query<{ version: string }>(
    "SELECT version FROM supabase_migrations.schema_migrations",
  );
  return new Set(rows.map((row) => row.version));
}

export interface ApplyMigrationsResult {
  readonly applied: readonly string[];
  readonly skipped: readonly string[];
}

/**
 * 按顺序应用 `supabase/migrations/*.sql`（等同 `supabase db push` 的 PG 直连实现）。
 */
export async function applyPendingMigrations(
  connectionString: string,
  repoRoot: string = resolveRepoRoot(),
): Promise<ApplyMigrationsResult> {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    await ensureMigrationTable(client);
    const done = await loadAppliedVersions(client);
    const files = listMigrationSqlFiles(repoRoot);

    for (const fileName of files) {
      const version = migrationVersionFromFileName(fileName);
      if (done.has(version)) {
        skipped.push(version);
        continue;
      }

      const filePath = path.join(repoRoot, "supabase", "migrations", fileName);
      const sql = fs.readFileSync(filePath, "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO supabase_migrations.schema_migrations (version, name)
           VALUES ($1, $2)`,
          [version, fileName],
        );
        await client.query("COMMIT");
        applied.push(version);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    await client.end();
  }

  return { applied, skipped };
}
