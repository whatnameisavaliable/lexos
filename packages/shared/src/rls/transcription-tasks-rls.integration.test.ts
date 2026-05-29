import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  loadAppRuntimeEnvFromProcess,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  resolveRepoRoot,
} from "../config/index.js";
import {
  createLawyerRlsFixture,
  fetchTranscriptionTaskAsUser,
  signInLawyerClient,
} from "./transcription-tasks-rls.js";

function canRunRlsIntegration(): boolean {
  try {
    const repoRoot = resolveRepoRoot();
    const presetPassword = process.env.AUTH_INITIAL_PASSWORD;
    loadEnvFiles(repoRoot, [".env", ".env.development"]);
    if (
      presetPassword?.trim() &&
      !process.env.AUTH_INITIAL_PASSWORD?.trim()
    ) {
      process.env.AUTH_INITIAL_PASSWORD = presetPassword;
    }
    loadAuthSeedEnvFromProcess();
    return true;
  } catch {
    return false;
  }
}

describe("transcription_tasks RLS (integration)", () => {
  it.skipIf(!canRunRlsIntegration())(
    "lawyer JWT cannot read another lawyer's task row",
    async () => {
      const repoRoot = resolveRepoRoot();
      const presetPassword = process.env.AUTH_INITIAL_PASSWORD;
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      if (
        presetPassword?.trim() &&
        !process.env.AUTH_INITIAL_PASSWORD?.trim()
      ) {
        process.env.AUTH_INITIAL_PASSWORD = presetPassword;
      }
      const appEnv = loadAppRuntimeEnvFromProcess();
      const authEnv = loadAuthSeedEnvFromProcess();

      const admin = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );

      const suffix = Date.now().toString(36);
      const lawyerA = await createLawyerRlsFixture(admin, {
        username: `lawyer_a_${suffix}`,
        password: authEnv.authInitialPassword,
        virtualEmailDomain: authEnv.authVirtualEmailDomain,
        title: `RLS Task A ${suffix}`,
      });
      const lawyerB = await createLawyerRlsFixture(admin, {
        username: `lawyer_b_${suffix}`,
        password: authEnv.authInitialPassword,
        virtualEmailDomain: authEnv.authVirtualEmailDomain,
        title: `RLS Task B ${suffix}`,
      });

      const clientA = await signInLawyerClient(
        appEnv.supabaseUrl,
        appEnv.supabaseAnonKey,
        lawyerA.virtualEmail,
        authEnv.authInitialPassword,
      );

      const ownTask = await fetchTranscriptionTaskAsUser(
        clientA,
        lawyerA.taskId,
      );
      expect(ownTask?.id).toBe(lawyerA.taskId);

      const otherTask = await fetchTranscriptionTaskAsUser(
        clientA,
        lawyerB.taskId,
      );
      expect(otherTask).toBeNull();
    },
    120_000,
  );
});
