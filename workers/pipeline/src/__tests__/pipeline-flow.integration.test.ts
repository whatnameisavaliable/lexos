import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { describe, expect, it, vi } from "vitest";
import {
  PIPELINE_STAGE_ASR,
  PIPELINE_STAGE_DRIVE_ARCHIVE,
  PIPELINE_STAGE_LLM,
} from "@lexos/shared";
import {
  loadAppRuntimeEnv,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  loadOutboxRuntimeEnvFromProcess,
  loadWorkerRuntimeEnvFromProcess,
  resolveRepoRoot,
  resolveVirtualEmail,
} from "@lexos/shared/config";
import { createPipelineStageProcessor } from "../bootstrap/create-pipeline-deps.js";
import { createWorkerDbPool } from "../infra/worker-db-pool.js";
import { withPgClient } from "../infra/with-pg-client.js";
import { OutboxPollerService } from "../services/outbox-poller.service.js";
import { StageIdempotencyMiddleware } from "../middleware/stage-idempotency.middleware.js";

function canRunPipelineIntegration(): boolean {
  try {
    const repoRoot = resolveRepoRoot();
    loadEnvFiles(repoRoot, [".env", ".env.development"]);
    loadAuthSeedEnvFromProcess();
    const env = loadAppRuntimeEnv(repoRoot);
    loadOutboxRuntimeEnvFromProcess();
    loadWorkerRuntimeEnvFromProcess();
    return (
      env.supabaseUrl.startsWith("http") &&
      !env.supabaseDbUrl.includes("your-password")
    );
  } catch {
    return false;
  }
}

async function seedLawyerWithDriveRoot(suffix: string) {
  const repoRoot = resolveRepoRoot();
  loadEnvFiles(repoRoot, [".env", ".env.development"]);
  const appEnv = loadAppRuntimeEnv(repoRoot);
  const authEnv = loadAuthSeedEnvFromProcess();
  const username = `m5k_lawyer_${suffix}`;

  const admin = createClient(
    appEnv.supabaseUrl,
    appEnv.supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const email = resolveVirtualEmail(username, authEnv.authVirtualEmailDomain);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: authEnv.authInitialPassword,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`createUser failed: ${error?.message}`);
  }

  await admin.from("profiles").insert({
    id: data.user.id,
    username,
    display_name: username,
    role: "lawyer",
    status: "enabled",
    requires_password_change: false,
    mfa_enabled: false,
  });

  await admin.from("drive_nodes").insert({
    created_by: data.user.id,
    parent_id: null,
    node_type: "folder",
    name: "__root__",
  });

  const cleanup = async () => {
    await admin.from("transcription_tasks").delete().eq("created_by", data.user!.id);
    await admin.from("drive_nodes").delete().eq("created_by", data.user!.id);
    await admin.auth.admin.deleteUser(data.user!.id);
  };

  return { appEnv, admin, userId: data.user.id, cleanup };
}

describe("pipeline worker (integration)", () => {
  it.skipIf(!canRunPipelineIntegration())(
    "asr → llm → drive.archive completes task with mock AI",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const workerEnv = loadWorkerRuntimeEnvFromProcess();
      const outboxEnv = loadOutboxRuntimeEnvFromProcess();
      const suffix = Date.now().toString(36);
      const { appEnv, admin, userId, cleanup } =
        await seedLawyerWithDriveRoot(suffix);

      const dbPool = createWorkerDbPool(outboxEnv);
      const mockAiClient = {
        transcribe: vi.fn().mockResolvedValue({ text: "integration asr text" }),
        complete: vi
          .fn()
          .mockResolvedValueOnce({
            content: "polished transcript",
            latencyMs: 12,
          })
          .mockResolvedValueOnce({
            content: "legal summary",
            latencyMs: 15,
          }),
      };
      const stageProcessor = createPipelineStageProcessor(workerEnv, {
        aiClient: mockAiClient,
      });
      const poller = new OutboxPollerService(
        outboxEnv,
        dbPool.getPool(),
        stageProcessor,
      );

      const { data: taskRow, error: taskError } = await admin
        .from("transcription_tasks")
        .insert({
          created_by: userId,
          title: "M5-K E2E",
          status: "asr_running",
          source_mime: "audio/mpeg",
          source_storage_key: `${userId}/task/sample.mp3`,
          size_bytes: 4096,
          is_mp4: false,
        })
        .select("id")
        .single();
      if (taskError || !taskRow) {
        throw new Error(taskError?.message ?? "task insert failed");
      }
      const taskId = taskRow.id as string;

      const taskDir = path.join(workerEnv.workerTmpDir, taskId);
      await mkdir(taskDir, { recursive: true });
      await writeFile(path.join(taskDir, "segment_000.mp3"), Buffer.from("fake"));

      const db = new pg.Client({ connectionString: appEnv.supabaseDbUrl });
      await db.connect();

      try {
        const { rows: outboxRows } = await db.query<{ id: string }>(
          `INSERT INTO public.outbox_events (
             aggregate_type, aggregate_id, event_type, payload
           ) VALUES (
             'transcription_task', $1::uuid, 'task.stage.asr',
             $2::jsonb
           ) RETURNING id`,
          [
            taskId,
            JSON.stringify({
              stage: PIPELINE_STAGE_ASR,
              taskId,
              createdBy: userId,
              isMp4: false,
            }),
          ],
        );
        const outboxId = outboxRows[0]!.id;

        let processedTotal = 0;
        for (let round = 0; round < 20; round += 1) {
          const { rows: statusRows } = await db.query<{ status: string }>(
            `SELECT status FROM public.transcription_tasks WHERE id = $1::uuid`,
            [taskId],
          );
          if (statusRows[0]?.status === "completed") {
            break;
          }
          processedTotal += await poller.pollOnce();
        }
        const { rows: taskStatus } = await db.query<{
          status: string;
          error_code: string | null;
          error_message: string | null;
        }>(
          `SELECT status, error_code, error_message
           FROM public.transcription_tasks WHERE id = $1::uuid`,
          [taskId],
        );
        expect(
          taskStatus[0]?.status,
          taskStatus[0]?.error_message ?? "task not completed",
        ).toBe("completed");
        expect(processedTotal).toBeGreaterThanOrEqual(1);

        const { rows: published } = await db.query<{ published_at: string | null }>(
          `SELECT published_at FROM public.outbox_events WHERE id = $1::uuid`,
          [outboxId],
        );
        expect(published[0]?.published_at).not.toBeNull();

        expect(mockAiClient.transcribe).toHaveBeenCalledTimes(1);
        expect(mockAiClient.complete).toHaveBeenCalledTimes(2);
      } finally {
        await db.end();
        await poller.stop();
        await dbPool.end();
        await cleanup();
      }
    },
    180_000,
  );

  it.skipIf(!canRunPipelineIntegration())(
    "duplicate outbox_event_id skips second ASR invocation",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const workerEnv = loadWorkerRuntimeEnvFromProcess();
      const outboxEnv = loadOutboxRuntimeEnvFromProcess();
      const suffix = Date.now().toString(36);
      const { appEnv, admin, userId, cleanup } =
        await seedLawyerWithDriveRoot(`${suffix}_idem`);

      const mockAiClient = {
        transcribe: vi.fn().mockResolvedValue({ text: "once" }),
        complete: vi.fn(),
      };
      const dbPool = createWorkerDbPool(outboxEnv);
      const stageProcessor = createPipelineStageProcessor(workerEnv, {
        aiClient: mockAiClient,
      });

      const { data: taskRow } = await admin
        .from("transcription_tasks")
        .insert({
          created_by: userId,
          title: "Idempotency",
          status: "asr_running",
          source_mime: "audio/mpeg",
          source_storage_key: `${userId}/task/idempotent.mp3`,
          size_bytes: 1024,
          is_mp4: false,
        })
        .select("id")
        .single();
      const taskId = taskRow!.id as string;

      const taskDir = path.join(workerEnv.workerTmpDir, taskId);
      await mkdir(taskDir, { recursive: true });
      await writeFile(path.join(taskDir, "segment_000.mp3"), Buffer.from("fake"));

      const client = new pg.Client({ connectionString: appEnv.supabaseDbUrl });
      await client.connect();

      try {
        const { rows } = await client.query<{ id: string }>(
          `INSERT INTO public.outbox_events (
             aggregate_type, aggregate_id, event_type, payload
           ) VALUES (
             'transcription_task', $1::uuid, 'task.stage.asr',
             $2::jsonb
           ) RETURNING id`,
          [
            taskId,
            JSON.stringify({
              stage: PIPELINE_STAGE_ASR,
              taskId,
              createdBy: userId,
              isMp4: false,
            }),
          ],
        );
        const eventId = rows[0]!.id;
        const payload = {
          stage: PIPELINE_STAGE_ASR,
          taskId,
          createdBy: userId,
          isMp4: false,
        };

        await stageProcessor.processStage(
          dbPool.getPool(),
          {
            id: eventId,
            aggregateType: "transcription_task",
            aggregateId: taskId,
            eventType: "task.stage.asr",
            payload,
            publishAttempts: 0,
          },
          payload,
        );

        const idempotency = new StageIdempotencyMiddleware();
        const second = await withPgClient(dbPool.getPool(), (pgClient) =>
          idempotency.tryBeginRun(pgClient, {
            stage: PIPELINE_STAGE_ASR,
            outboxEventId: eventId,
            taskId,
          }),
        );

        expect(second.proceed).toBe(false);
        expect(mockAiClient.transcribe).toHaveBeenCalledTimes(1);
      } finally {
        await client.end();
        await dbPool.end();
        await cleanup();
      }
    },
    120_000,
  );
});

describe("stalled scanner (integration)", () => {
  it.skipIf(!canRunPipelineIntegration())(
    "recovers task when last_progress_at timed out",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const outboxEnv = loadOutboxRuntimeEnvFromProcess();
      const suffix = Date.now().toString(36);
      const { admin, userId, cleanup } = await seedLawyerWithDriveRoot(
        `${suffix}_stalled`,
      );

      const { StalledTaskScannerService } = await import(
        "../../../scheduler/src/stalled-task-scanner.service.js"
      );
      const { WorkerAuditAdapter } = await import(
        "../adapters/audit/worker-audit.adapter.js"
      );
      const dbPool = createWorkerDbPool(outboxEnv);
      const scanner = new StalledTaskScannerService(
        { timeoutMs: 1, maxRetries: 3 },
        new WorkerAuditAdapter(outboxEnv),
      );

      const { data: taskRow } = await admin
        .from("transcription_tasks")
        .insert({
          created_by: userId,
          title: "Stalled",
          status: "llm_running",
          source_mime: "audio/mpeg",
          source_storage_key: `${userId}/task/stalled.mp3`,
          size_bytes: 1024,
          is_mp4: false,
          last_progress_at: new Date(Date.now() - 60_000).toISOString(),
        })
        .select("id")
        .single();
      const taskId = taskRow!.id as string;

      const db = new pg.Client({ connectionString: appEnv.supabaseDbUrl });
      await db.connect();

      try {
        const recovered = await scanner.scanOnce(dbPool.getPool());
        expect(recovered).toBe(1);

        const { rows } = await db.query<{ status: string; retry_count: number }>(
          `SELECT status, retry_count
           FROM public.transcription_tasks
           WHERE id = $1::uuid`,
          [taskId],
        );
        expect(rows[0]?.status).toBe("queued");
        expect(rows[0]?.retry_count).toBe(1);

        const { rows: outbox } = await db.query<{ payload: { stage?: string } }>(
          `SELECT payload
           FROM public.outbox_events
           WHERE aggregate_id = $1::uuid
             AND published_at IS NULL
           ORDER BY created_at DESC
           LIMIT 1`,
          [taskId],
        );
        expect(outbox[0]?.payload.stage).toBe(PIPELINE_STAGE_LLM);
      } finally {
        await db.end();
        await dbPool.end();
        await cleanup();
      }
    },
    120_000,
  );
});
