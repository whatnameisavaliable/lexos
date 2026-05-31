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
import { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";
import { TranscriptionTaskGetService } from "../services/transcription-task-get.service.js";

interface LawyerFixture {
  readonly userId: string;
  readonly username: string;
  readonly accessToken: string;
}

function canRunRlsSmoke(): boolean {
  try {
    const repoRoot = resolveRepoRoot();
    loadEnvFiles(repoRoot, [".env", ".env.development"]);
    const env = loadAppRuntimeEnv(repoRoot);
    return (
      env.supabaseUrl.startsWith("http") &&
      env.supabaseDbUrl.startsWith("postgresql://") &&
      !env.supabaseDbUrl.includes("your-password")
    );
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
  const username = `m9_smoke_${suffix}`;
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

  await admin.from("drive_nodes").insert({
    created_by: data.user.id,
    parent_id: null,
    node_type: "folder",
    name: "__root__",
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
    await admin
      .from("transcription_tasks")
      .delete()
      .eq("created_by", fixture.userId);
    await admin.from("drive_nodes").delete().eq("created_by", fixture.userId);
    await admin.auth.admin.deleteUser(fixture.userId);
  };

  return { fixture, cleanup };
}

describe("smoke RLS lawyer isolation (integration)", () => {
  it.skipIf(!canRunRlsSmoke())(
    "lawyer A cannot read lawyer B transcription_tasks",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);
      const admin = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );

      const { fixture: lawyerA, cleanup: cleanupA } =
        await createLawyerFixture(`${suffix}_a`);
      const { fixture: lawyerB, cleanup: cleanupB } =
        await createLawyerFixture(`${suffix}_b`);

      const taskRepo = new TranscriptionTaskRepository(appEnv);
      const taskGetService = new TranscriptionTaskGetService(taskRepo);

      try {
        const { data: taskB, error: insertError } = await admin
          .from("transcription_tasks")
          .insert({
            created_by: lawyerB.userId,
            title: "private-task",
            status: "queued",
            source_mime: "audio/mpeg",
            source_storage_key: `${lawyerB.userId}/task-b/source.mp3`,
            size_bytes: 1000,
            is_mp4: false,
          })
          .select("id")
          .single();
        expect(insertError).toBeNull();
        expect(taskB?.id).toBeTruthy();

        const actorA = createAuthContext({
          userId: lawyerA.userId,
          role: "lawyer",
          username: lawyerA.username,
          requiresPasswordChange: false,
        });

        await expect(
          taskGetService.get(actorA, lawyerA.accessToken, taskB!.id as string),
        ).rejects.toMatchObject({
          code: ErrorCode.RESOURCE_NOT_FOUND,
        });

        const hidden = await taskRepo.findById(
          lawyerA.accessToken,
          taskB!.id as string,
        );
        expect(hidden).toBeNull();
      } finally {
        await cleanupA();
        await cleanupB();
      }
    },
  );

  it.skipIf(!canRunRlsSmoke())(
    "lawyer A cannot read lawyer B drive_nodes",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);

      const { fixture: lawyerA, cleanup: cleanupA } =
        await createLawyerFixture(`${suffix}_a`);
      const { fixture: lawyerB, cleanup: cleanupB } =
        await createLawyerFixture(`${suffix}_b`);

      const driveRepo = new DriveNodeRepository(appEnv);

      try {
        const rootB = await driveRepo.findRootByUser(lawyerB.accessToken);
        expect(rootB).not.toBeNull();

        const folderB = await driveRepo.createFolder(lawyerB.accessToken, {
          createdBy: lawyerB.userId,
          parentId: rootB!.id,
          name: "rls-smoke-private",
        });

        const hidden = await driveRepo.findById(
          lawyerA.accessToken,
          folderB.id,
        );
        expect(hidden).toBeNull();
      } finally {
        await cleanupA();
        await cleanupB();
      }
    },
  );
});
