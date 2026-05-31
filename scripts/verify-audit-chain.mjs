#!/usr/bin/env node
/**
 * 运维可选：顺序校验 `audit_logs.prev_hash` 与 `row_hash` 链接（非热路径）。
 * 用法：`node scripts/verify-audit-chain.mjs`（需 `SUPABASE_DB_URL`）。
 */
import { Client } from "pg";

const url = process.env.SUPABASE_DB_URL?.trim();
if (!url) {
  console.error("SUPABASE_DB_URL is required");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();

const { rows } = await client.query(
  `SELECT id, prev_hash, row_hash, created_at
   FROM public.audit_logs
   ORDER BY created_at ASC, id ASC`,
);

let prevHash = null;
let broken = 0;

for (const row of rows) {
  if (row.prev_hash !== prevHash) {
    broken += 1;
    console.error(
      `chain break at ${row.id}: expected prev_hash=${prevHash ?? "NULL"}, got ${row.prev_hash}`,
    );
  }
  prevHash = row.row_hash;
}

await client.end();

if (broken > 0) {
  console.error(`verify-audit-chain: ${broken} break(s) in ${rows.length} row(s)`);
  process.exit(2);
}

console.log(`verify-audit-chain: OK (${rows.length} rows)`);
