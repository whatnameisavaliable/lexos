import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import {
  loadAppRuntimeEnv,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  resolveRepoRoot,
  resolveVirtualEmail,
} from "@lexos/shared/config";
import { TranscriptionTranscriptRepository } from "../repositories/transcription-transcript.repository.js";
import { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";
import { TranscriptionTranscriptGetService } from "../services/transcription-transcript-get.service.js";
import { TranscriptionTranscriptPatchService } from "../services/transcription-transcript-patch.service.js";

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

function canRunTranscriptIntegration(): boolean {
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

async function createLawyerFixture(
  suffix: string,
): Promise<{ fixture: LawyerFixture; cleanup: () => Promise<void> }> {
  const repoRoot = resolveRepoRoot();
  loadEnvFiles(repoRoot, [".env", ".env.development"]);
  const appEnv = loadAppRuntimeEnv(repoRoot);
  const authEnv = loadAuthSeedEnvFromProcess();
  const username = `m6_lawyer_${suffix}`;
  const password = authEnv.authInitialPassword;

  const admin = createClient(appEnv.supabaseUrl, appEnv.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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
  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  });
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

async function seedCompletedTaskWithTranscript(
  appEnv: ReturnType<typeof loadAppRuntimeEnv>,
  ownerId: string,
): Promise<string> {
  const admin = createClient(appEnv.supabaseUrl, appEnv.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: task, error: taskError } = await admin
    .from("transcription_tasks")
    .insert({
      created_by: ownerId,
      title: "M6 集成测试任务",
      status: "completed",
      source_mime: "audio/mpeg",
      source_storage_key: `${ownerId}/m6-task/source.mp3`,
      audio_storage_key: `${ownerId}/m6-task/audio.mp3`,
      size_bytes: 1024,
      is_mp4: false,
      diarization_degraded: false,
    })
    .select("id")
    .single();

  if (taskError || !task) {
    throw new Error(`seed task failed: ${taskError?.message}`);
  }

  const { error: transcriptError } = await admin.from("transcription_transcripts").insert({
    task_id: task.id,
    asr_raw_json: {
      segments: [{ segmentIndex: 0, startMs: 0, endMs: 1000, text: "hello" }],
    },
    polished_text: "hello polished",
    summary_text: "summary",
    version: 1,
    updated_by: ownerId,
  });

  if (transcriptError) {
    throw new Error(`seed transcript failed: ${transcriptError.message}`);
  }

  return task.id as string;
}

describe("transcription transcript workbench (integration)", () => {
  it.skipIf(!canRunTranscriptIntegration())(
    "PATCH stale version returns RESOURCE_CONFLICT",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);
      const { fixture, cleanup } = await createLawyerFixture(suffix);

      try {
        const taskId = await seedCompletedTaskWithTranscript(appEnv, fixture.userId);
        const taskRepository = new TranscriptionTaskRepository(appEnv);
        const transcriptRepository = new TranscriptionTranscriptRepository(appEnv);
        const patchService = new TranscriptionTranscriptPatchService(
          taskRepository,
          transcriptRepository,
        );
        const actor = createAuthContext({
          userId: fixture.userId,
          role: "lawyer",
          username: fixture.username,
          requiresPasswordChange: false,
        });

        await patchService.patch(
          actor,
          fixture.accessToken,
          taskId,
          { polishedText: "first save" },
          1,
        );

        await expect(
          patchService.patch(
            actor,
            fixture.accessToken,
            taskId,
            { polishedText: "conflict save" },
            1,
          ),
        ).rejects.toMatchObject({ code: ErrorCode.RESOURCE_CONFLICT });
      } finally {
        await cleanup();
      }
    },
  );

  it.skipIf(!canRunTranscriptIntegration())(
    "lawyer B cannot GET lawyer A transcript",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);
      const { fixture: lawyerA, cleanup: cleanupA } =
        await createLawyerFixture(`${suffix}_a`);
      const { fixture: lawyerB, cleanup: cleanupB } =
        await createLawyerFixture(`${suffix}_b`);

      try {
        const taskId = await seedCompletedTaskWithTranscript(appEnv, lawyerA.userId);
        const getService = new TranscriptionTranscriptGetService(
          new TranscriptionTaskRepository(appEnv),
          new TranscriptionTranscriptRepository(appEnv),
        );

        await expect(
          getService.get(
            createAuthContext({
              userId: lawyerB.userId,
              role: "lawyer",
              username: lawyerB.username,
              requiresPasswordChange: false,
            }),
            lawyerB.accessToken,
            taskId,
          ),
        ).rejects.toMatchObject({
          code: ErrorCode.RESOURCE_NOT_FOUND,
        });
      } finally {
        await cleanupA();
        await cleanupB();
      }
    },
  );
});
