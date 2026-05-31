import pg from "pg";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
config({ path: path.join(repoRoot, ".env.development"), override: true });

const pool = new pg.Pool({
  connectionString: process.env.WORKER_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const result = await pool.query(
  `SELECT t.id, t.title, t.status, t.created_at,
          tt.polished_text IS NOT NULL AS has_polished,
          tt.summary_text IS NOT NULL AS has_summary,
          length(tt.polished_text) AS polished_len,
          length(tt.summary_text) AS summary_len
   FROM public.transcription_tasks t
   LEFT JOIN public.transcription_transcripts tt ON tt.task_id = t.id
   WHERE t.status = 'completed'
   ORDER BY t.created_at DESC
   LIMIT 10`,
);

console.log("=== completed tasks with transcripts ===");
for (const row of result.rows) {
  console.log(JSON.stringify(row));
}

await pool.end();
