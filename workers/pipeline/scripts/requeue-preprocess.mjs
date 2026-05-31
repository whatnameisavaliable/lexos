/**
 * 将 failed 的转写任务重新入队 media.preprocess（开发调试用）。
 * 用法：node workers/pipeline/scripts/requeue-preprocess.mjs [taskId]
 */
import pg from "pg";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
config({ path: path.join(repoRoot, ".env.development"), override: true });

const taskId = process.argv[2];
if (!taskId) {
  console.error(
    "Usage: node workers/pipeline/scripts/requeue-preprocess.mjs <taskId>",
  );
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.WORKER_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const client = await pool.connect();
try {
  await client.query("BEGIN");
  const taskResult = await client.query(
    `SELECT created_by, is_mp4, status
     FROM public.transcription_tasks
     WHERE id = $1::uuid`,
    [taskId],
  );
  const task = taskResult.rows[0];
  if (!task) {
    throw new Error(`task not found: ${taskId}`);
  }

  await client.query(
    `UPDATE public.transcription_tasks
     SET status = 'queued',
         error_code = NULL,
         error_message = NULL,
         updated_at = now()
     WHERE id = $1::uuid`,
    [taskId],
  );

  const payload = JSON.stringify({
    stage: "media.preprocess",
    taskId,
    createdBy: task.created_by,
    isMp4: task.is_mp4,
  });
  const outboxResult = await client.query(
    `INSERT INTO public.outbox_events (
       aggregate_type, aggregate_id, event_type, payload
     ) VALUES (
       'transcription_task', $1::uuid, 'task.queued', $2::jsonb
     ) RETURNING id`,
    [taskId, payload],
  );

  await client.query("COMMIT");
  console.log(
    `Requeued task ${taskId} (was ${task.status}) outbox=${outboxResult.rows[0]?.id}`,
  );
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  client.release();
  await pool.end();
}
