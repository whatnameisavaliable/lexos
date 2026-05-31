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

const tasks = await pool.query(
  `SELECT id, status, error_code, error_message, source_storage_key,
          audio_storage_key, created_at, updated_at
   FROM public.transcription_tasks
   ORDER BY created_at DESC
   LIMIT 8`,
);
console.log("=== tasks ===");
for (const r of tasks.rows) {
  console.log(
    JSON.stringify({
      id: r.id,
      status: r.status,
      error: r.error_code,
      msg: r.error_message,
      key: r.source_storage_key,
      at: r.updated_at,
    }),
  );
}

const outbox = await pool.query(
  `SELECT id, aggregate_id, event_type,
          payload->>'stage' AS stage,
          published_at, publish_attempts, created_at
   FROM public.outbox_events
   ORDER BY created_at DESC
   LIMIT 10`,
);
console.log("=== outbox ===");
for (const r of outbox.rows) {
  console.log(
    JSON.stringify({
      id: r.id,
      task: r.aggregate_id,
      stage: r.stage,
      published: Boolean(r.published_at),
      attempts: r.publish_attempts,
      at: r.created_at,
    }),
  );
}

const runs = await pool.query(
  `SELECT stage, status, task_id, started_at, finished_at
   FROM public.pipeline_job_runs
   ORDER BY started_at DESC
   LIMIT 10`,
);
console.log("=== pipeline_job_runs ===");
for (const r of runs.rows) {
  console.log(JSON.stringify(r));
}

await pool.end();
