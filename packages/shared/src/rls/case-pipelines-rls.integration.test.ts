import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  loadAppRuntimeEnv,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  resolveRepoRoot,
  resolveVirtualEmail,
} from "../config/index.js";
import {
  fetchCasePipelineAsUser,
  fetchPipelineArtifactAsUser,
} from "./case-pipelines-rls.js";

interface LawyerFixture {
  readonly userId: string;
  readonly accessToken: string;
}

function canRunSopRlsIntegration(): boolean {
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
  const username = `m10_lawyer_${suffix}`;
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
    accessToken: signIn.session.access_token,
  };

  const cleanup = async () => {
    await admin.auth.admin.deleteUser(fixture.userId);
  };

  return { fixture, cleanup };
}

describe("case_pipelines RLS (integration)", () => {
  it.skipIf(() => !canRunSopRlsIntegration())(
    "lawyer A cannot SELECT lawyer B case_pipelines",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);

      const admin = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );

      const lawyerA = await createLawyerFixture("a");
      const lawyerB = await createLawyerFixture("b");

      const { data: adminProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("username", "admin")
        .single();

      const templateVersionId = crypto.randomUUID();
      const templateId = crypto.randomUUID();
      const pipelineId = crypto.randomUUID();
      const artifactId = crypto.randomUUID();

      try {
        await admin.from("sop_templates").insert({
          id: templateId,
          name: "M10 RLS Test",
          case_type: "civil",
          created_by: adminProfile!.id,
        });
        await admin.from("sop_template_versions").insert({
          id: templateVersionId,
          template_id: templateId,
          version_number: 1,
          is_published: true,
          created_by: adminProfile!.id,
        });
        await admin.from("case_pipelines").insert({
          id: pipelineId,
          lawyer_id: lawyerB.fixture.userId,
          template_version_id: templateVersionId,
          status: "in_progress",
        });
        await admin.from("pipeline_artifacts").insert({
          id: artifactId,
          pipeline_id: pipelineId,
          step_code: "01-A",
          content_type: "markdown",
          status: "draft",
        });

        const pipelineResult = await fetchCasePipelineAsUser(
          appEnv.supabaseUrl,
          appEnv.supabaseAnonKey,
          lawyerA.fixture.accessToken,
          pipelineId,
        );
        expect(pipelineResult.data).toBeNull();

        const artifactResult = await fetchPipelineArtifactAsUser(
          appEnv.supabaseUrl,
          appEnv.supabaseAnonKey,
          lawyerA.fixture.accessToken,
          artifactId,
        );
        expect(artifactResult.data).toBeNull();
      } finally {
        await admin.from("pipeline_artifacts").delete().eq("id", artifactId);
        await admin.from("case_pipelines").delete().eq("id", pipelineId);
        await admin
          .from("sop_template_versions")
          .delete()
          .eq("id", templateVersionId);
        await admin.from("sop_templates").delete().eq("id", templateId);
        await lawyerA.cleanup();
        await lawyerB.cleanup();
      }
    },
  );
});
