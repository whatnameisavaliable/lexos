import fs from "node:fs";
import pg from "pg";

/**
 * 对 Postgres 执行单个 SQL 文件（不依赖 Supabase CLI，Windows 可用）。
 */
export async function runSqlFile(
  connectionString: string,
  filePath: string,
): Promise<void> {
  const sql = fs.readFileSync(filePath, "utf8");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}
