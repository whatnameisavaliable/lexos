import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { describe, expect, it } from "vitest";
import {
  PIPELINE_QUEUE_MEDIA_PREPROCESS,
  createAuthContext,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import {
  loadAppRuntimeEnv,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  loadOutboxRuntimeEnvFromProcess,
  resolveRepoRoot,
  resolveVirtualEmail,
} from "@lexos/shared/config";
import type {
  ResumableUploadMetadata,
  StorageAdapter,
  StorageObjectHead,
  StorageObjectSummary,
} from "../adapters/storage/storage.adapter.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { AuditLogRepository } from "../repositories/audit-log.repository.js";
import { OutboxRepository } from "../repositories/outbox.repository.js";
import { TaskStateRepository } from "../repositories/task-state.repository.js";
import { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";
import { TranscriptionTaskWriteRepository } from "../repositories/transcription-task-write.repository.js";
import { UploadSessionRepository } from "../repositories/upload-session.repository.js";
import { TranscriptionTaskGetService } from "../services/transcription-task-get.service.js";
import { TranscriptionUploadCompleteService } from "../services/transcription-upload-complete.service.js";
import { TranscriptionUploadInitService } from "../services/transcription-upload-init.service.js";

/** 可配置 mock 对象的 Storage 适配器（模拟 TUS 完成后桶内已有文件）。 */
class MockStorageAdapter implements StorageAdapter {
  private readonly objectsByPrefix = new Map<string, StorageObjectSummary[]>();

  seedObjects(prefix: string, objects: readonly StorageObjectSummary[]): void {
    this.objectsByPrefix.set(prefix, [...objects]);
  }

  async listObjectsByPrefix(prefix: string): Promise<StorageObjectSummary[]> {
    return this.objectsByPrefix.get(prefix) ?? [];
  }

  async headObject(_objectKey: string): Promise<StorageObjectHead | null> {
    return null;
  }

  async createResumableUploadUrl(params: {
    objectKey: string;
  }): Promise<ResumableUploadMetadata> {
    return {
      tusEndpoint:
        "https://example.supabase.co/storage/v1/upload/resumable/sign",
      tusHeaders: { Authorization: "Bearer mock-tus-token" },
      objectKey: params.objectKey,
    };
  }
}

interface LawyerFixture {
  readonly userId: string;
  readonly username: string;
  readonly accessToken: string;
}

function isDbConfigured(dbUrl: string): boolean {
  return (
    dbUrl.startsWith("postgresql://") &&
    !dbUrl.includes("your-password") &&
    !dbUrl.includes("your-project-ref")
  );
}

function canRunTranscriptionIntegration(): boolean {
  try {
    const repoRoot = resolveRepoRoot();
    loadEnvFiles(repoRoot, [".env", ".env.development"]);
    loadAuthSeedEnvFromProcess();
    const env = loadAppRuntimeEnv(repoRoot);
    return env.supabaseUrl.startsWith("http") && isDbConfigured(env.supabaseDbUrl);
  } catch {
    return false;
  }
}

function canRunOutboxRedisIntegration(): boolean {
  if (!canRunTranscriptionIntegration()) {
    return false;
  }
  try {
    loadOutboxRuntimeEnvFromProcess();
    return true;
  } catch {
    return false;
  }
}

async function createLawyerFixture(
  suffix: string,
): Promise<{ fixture: LawyerFixture; cleanup: () => Promise<void> }> {
  const repoRoot = resolveRepoRoot();
  loadEnvFiles(repoRoot, [".env", ".env.development"]);
  const appEnv = loadAppRuntimeEnv(repoRoot);
  const authEnv = loadAuthSeedEnvFromProcess();
  const username = `m4_lawyer_${suffix}`;
  const password = authEnv.authInitialPassword;

  const admin = createClient(
    appEnv.supabaseUrl,
    appEnv.supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const email = resolveVirtualEmail(username, authEnv.authVirtualEmailDomain);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
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

  const anon = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signIn, error: signInError } =
    await anon.auth.signInWithPassword({ email, password });
  if (signInError || !signIn.session) {
    throw new Error(`signIn failed: ${signInError?.message}`);
  }

  const fixture: LawyerFixture = {
    userId: data.user.id,
    username,
    accessToken: signIn.session.access_token,
  };

  const cleanup = async () => {
    await admin.from("transcription_tasks").delete().eq("created_by", fixture.userId);
    await admin.auth.admin.deleteUser(fixture.userId);
  };

  return { fixture, cleanup };
}

function buildUploadServices(appEnv: ReturnType<typeof loadAppRuntimeEnv>) {
  const storage = new MockStorageAdapter();
  const taskRepository = new TranscriptionTaskRepository(appEnv);
  const uploadSessionRepository = new UploadSessionRepository(appEnv);
  const initService = new TranscriptionUploadInitService(
    taskRepository,
    uploadSessionRepository,
    storage,
    new AuditLogRepository(appEnv),
  );
  const completeService = new TranscriptionUploadCompleteService(
    appEnv,
    taskRepository,
    new TranscriptionTaskWriteRepository(),
    uploadSessionRepository,
    storage,
    new TaskStateRepository(),
    new OutboxRepository(),
  );
  return { storage, taskRepository, initService, completeService };
}

describe("transcription upload flow (integration)", () => {
  it.skipIf(!canRunTranscriptionIntegration())(
    "init → mock Storage object → complete → task queued + unpublished outbox",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);
      const { fixture, cleanup } = await createLawyerFixture(suffix);

      try {
        const { storage, taskRepository, initService, completeService } =
          buildUploadServices(appEnv);
        const actor = createAuthContext({
          userId: fixture.userId,
          role: "lawyer",
          username: fixture.username,
          requiresPasswordChange: false,
        });

        const initResult = await initService.init(actor, fixture.accessToken, {
          title: "M4 集成测试",
          fileName: "sample.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: 4096n,
          durationSec: 120,
        });

        const task = await taskRepository.findById(
          fixture.accessToken,
          initResult.taskId,
        );
        expect(task?.status).toBe("uploading");

        storage.seedObjects(initResult.storageKeyPrefix, [
          {
            name: task!.sourceStorageKey,
            sizeBytes: 4096,
            mimeType: "audio/mpeg",
          },
        ]);

        const completeResult = await completeService.complete(
          actor,
          fixture.accessToken,
          { uploadSessionId: initResult.uploadSessionId },
        );
        expect(completeResult).toEqual({
          taskId: initResult.taskId,
          status: "queued",
        });

        const queuedTask = await taskRepository.findById(
          fixture.accessToken,
          initResult.taskId,
        );
        expect(queuedTask?.status).toBe("queued");

        const db = new pg.Client({ connectionString: appEnv.supabaseDbUrl });
        await db.connect();
        try {
          const { rows } = await db.query<{
            event_type: string;
            published_at: string | null;
            payload: Record<string, unknown>;
          }>(
            `SELECT event_type, published_at, payload
             FROM public.outbox_events
             WHERE aggregate_id = $1::uuid
             ORDER BY created_at DESC
             LIMIT 1`,
            [initResult.taskId],
          );
          expect(rows.length).toBe(1);
          expect(rows[0]?.event_type).toBe("task.queued");
          expect(rows[0]?.published_at).toBeNull();
          expect(rows[0]?.payload).toMatchObject({
            queueName: PIPELINE_QUEUE_MEDIA_PREPROCESS,
            taskId: initResult.taskId,
            createdBy: fixture.userId,
            isMp4: false,
          });
        } finally {
          await db.end();
        }
      } finally {
        await cleanup();
      }
    },
    120_000,
  );

  it.skipIf(!canRunTranscriptionIntegration())(
    "lawyer B cannot GET lawyer A task",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);
      const owner = await createLawyerFixture(`${suffix}_a`);
      const other = await createLawyerFixture(`${suffix}_b`);

      try {
        const { initService } = buildUploadServices(appEnv);
        const ownerActor = createAuthContext({
          userId: owner.fixture.userId,
          role: "lawyer",
          username: owner.fixture.username,
          requiresPasswordChange: false,
        });
        const initResult = await initService.init(
          ownerActor,
          owner.fixture.accessToken,
          {
            title: "他人不可见",
            fileName: "private.mp3",
            mimeType: "audio/mpeg",
            sizeBytes: 1024n,
          },
        );

        const getService = new TranscriptionTaskGetService(
          new TranscriptionTaskRepository(appEnv),
        );
        const otherActor = createAuthContext({
          userId: other.fixture.userId,
          role: "lawyer",
          username: other.fixture.username,
          requiresPasswordChange: false,
        });

        await expect(
          getService.get(
            otherActor,
            other.fixture.accessToken,
            initResult.taskId,
          ),
        ).rejects.toMatchObject({
          code: ErrorCode.RESOURCE_NOT_FOUND,
        } satisfies Partial<AppHttpError>);
      } finally {
        await owner.cleanup();
        await other.cleanup();
      }
    },
    120_000,
  );

  it.skipIf(!canRunOutboxRedisIntegration())(
    "outbox dispatcher publishes media.preprocess BullMQ job after complete",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const outboxEnv = loadOutboxRuntimeEnvFromProcess();
      const suffix = Date.now().toString(36);
      const { fixture, cleanup } = await createLawyerFixture(suffix);

      const { OutboxPollerService } = await import(
        "../../../../workers/outbox-dispatcher/src/outbox-poller.service.js"
      );
      const { Queue } = await import("bullmq");
      const IORedis = (await import("ioredis")).default;

      const poller = new OutboxPollerService(outboxEnv);
      const redis = new IORedis(outboxEnv.redisUrl, { maxRetriesPerRequest: null });
      const queue = new Queue(PIPELINE_QUEUE_MEDIA_PREPROCESS, {
        connection: redis,
      });

      try {
        const { storage, taskRepository, initService, completeService } =
          buildUploadServices(appEnv);
        const actor = createAuthContext({
          userId: fixture.userId,
          role: "lawyer",
          username: fixture.username,
          requiresPasswordChange: false,
        });

        const initResult = await initService.init(actor, fixture.accessToken, {
          title: "Outbox 投递测试",
          fileName: "queue.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: 2048n,
        });
        const task = await taskRepository.findById(
          fixture.accessToken,
          initResult.taskId,
        );
        storage.seedObjects(initResult.storageKeyPrefix, [
          {
            name: task!.sourceStorageKey,
            sizeBytes: 2048,
            mimeType: "audio/mpeg",
          },
        ]);

        await completeService.complete(actor, fixture.accessToken, {
          uploadSessionId: initResult.uploadSessionId,
        });

        const published = await poller.pollOnce();
        expect(published).toBeGreaterThanOrEqual(1);

        const job = await queue.getJob(
          `${initResult.taskId}:${PIPELINE_QUEUE_MEDIA_PREPROCESS}`,
        );
        expect(job).toBeTruthy();
        expect(job?.data).toMatchObject({
          taskId: initResult.taskId,
          createdBy: fixture.userId,
          isMp4: false,
        });

        if (job) {
          await job.remove();
        }
      } finally {
        await poller.stop();
        await queue.close();
        redis.disconnect();
        await cleanup();
      }
    },
    120_000,
  );
});
