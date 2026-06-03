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
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import { SopPipelineStatusService } from "../services/sop-pipeline-status.service.js";
import { SopStepSnapshotRepository } from "../repositories/sop-step-snapshot.repository.js";
import { PipelineArtifactRepository } from "../repositories/pipeline-artifact.repository.js";
import { SystemSettingReadRepository } from "../repositories/system-setting-read.repository.js";
import { SystemSettingReadService } from "../services/system-setting-read.service.js";

interface LawyerFixture {
  readonly userId: string;
  readonly username: string;
  readonly accessToken: string;
}

function canRunSopIntegration(): boolean {
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
  const username = `m13_lawyer_${suffix}`;
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
    await admin.auth.admin.deleteUser(fixture.userId);
  };

  return { fixture, cleanup };
}

describe("sop pipeline lawyer isolation (integration)", () => {
  it.skipIf(!canRunSopIntegration())(
    "lawyer A cannot GET status for lawyer B pipeline via service layer",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);

      const { fixture: lawyerA, cleanup: cleanupA } =
        await createLawyerFixture(`${suffix}_a`);
      const { fixture: lawyerB, cleanup: cleanupB } =
        await createLawyerFixture(`${suffix}_b`);

      const admin = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );

      const pipelineRepo = new CasePipelineRepository(appEnv);
      const systemSettingReadService = new SystemSettingReadService(
        new SystemSettingReadRepository(appEnv),
      );
      const statusService = new SopPipelineStatusService(
        pipelineRepo,
        new SopStepSnapshotRepository(appEnv),
        new PipelineArtifactRepository(appEnv),
        systemSettingReadService,
      );

      try {
        const { data: versionRow, error: versionError } = await admin
          .from("sop_template_versions")
          .select("id")
          .eq("is_published", true)
          .limit(1)
          .maybeSingle();
        if (versionError || !versionRow) {
          return;
        }

        const pipelineB = await pipelineRepo.createPipeline(
          lawyerB.accessToken,
          versionRow.id,
          lawyerB.userId,
          "step_a",
        );

        const actorA = createAuthContext({
          userId: lawyerA.userId,
          role: "lawyer",
          username: lawyerA.username,
          requiresPasswordChange: false,
        });

        await expect(
          statusService.getStatus(actorA, lawyerA.accessToken, pipelineB.id),
        ).rejects.toMatchObject({
          code: ErrorCode.AUTH_FORBIDDEN,
        });
      } finally {
        await cleanupA();
        await cleanupB();
      }
    },
  );

  it("maps cross-lawyer pipeline access to AppHttpError", async () => {
    const pipelineRepo = {
      findPipelineForLawyer: async () => null,
    };
    const statusService = new SopPipelineStatusService(
      pipelineRepo as never,
      { listStepsByTemplateVersionId: async () => [] } as never,
      { findArtifactByStep: async () => null } as never,
      { isDeepResearchEnabled: async () => true } as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    await expect(
      statusService.getStatus(actor, "token", "00000000-0000-4000-8000-000000009999"),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
