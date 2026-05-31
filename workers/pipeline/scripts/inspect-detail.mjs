import pg from "pg";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
config({ path: path.join(repoRoot, ".env.development"), override: true });

const pool = new pg.Pool({
  connectionString: process.env.WORKER_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const taskId = process.argv[2] ?? "19903fad-7894-4ec6-995d-59a98a1a9aaa";

const runs = await pool.query(
  `SELECT stage, status, outbox_event_id, started_at, finished_at
   FROM public.pipeline_job_runs
   WHERE task_id = $1::uuid
   ORDER BY started_at`,
  [taskId],
);
console.log("=== job_runs ===");
for (const r of runs.rows) console.log(JSON.stringify(r));

const maps = await pool.query(
  `SELECT feature_key, primary_model_id, fallback_model_id
   FROM public.ai_feature_model_mappings
   ORDER BY feature_key`,
);
console.log("=== ai_mappings ===");
for (const r of maps.rows) console.log(JSON.stringify(r));

const unpublished = await pool.query(
  `SELECT id, aggregate_id, payload->>'stage' AS stage, publish_attempts
   FROM public.outbox_events
   WHERE published_at IS NULL
   ORDER BY created_at ASC
   LIMIT 10`,
);
console.log("=== unpublished_outbox ===");
for (const r of unpublished.rows) console.log(JSON.stringify(r));

await pool.end();
