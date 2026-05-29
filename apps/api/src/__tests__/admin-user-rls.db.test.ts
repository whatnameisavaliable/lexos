import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  loadAppRuntimeEnv,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  resolveRepoRoot,
  resolveVirtualEmail,
} from "@lexos/shared/config";

function canRunProfileRlsTest(): boolean {
  try {
    const repoRoot = resolveRepoRoot();
    loadEnvFiles(repoRoot, [".env", ".env.development"]);
    loadAuthSeedEnvFromProcess();
    const env = loadAppRuntimeEnv(repoRoot);
    return (
      env.supabaseUrl.startsWith("http") &&
      !env.supabaseDbUrl.includes("your-password")
    );
  } catch {
    return false;
  }
}

describe("profiles RLS (integration)", () => {
  it.skipIf(!canRunProfileRlsTest())(
    "lawyer JWT cannot UPDATE another user's profiles.role",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const authEnv = loadAuthSeedEnvFromProcess();
      const suffix = Date.now().toString(36);

      const admin = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );

      const victimUsername = `rls_victim_${suffix}`;
      const attackerUsername = `rls_attacker_${suffix}`;
      const password = authEnv.authInitialPassword;

      for (const username of [victimUsername, attackerUsername]) {
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
      }

      const victim = await admin
        .from("profiles")
        .select("id")
        .eq("username", victimUsername)
        .single();
      const attackerEmail = resolveVirtualEmail(
        attackerUsername,
        authEnv.authVirtualEmailDomain,
      );

      const anon = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: signIn, error: signInError } =
        await anon.auth.signInWithPassword({
          email: attackerEmail,
          password,
        });
      if (signInError || !signIn.session) {
        throw new Error(`signIn failed: ${signInError?.message}`);
      }

      const lawyerClient = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseAnonKey,
        {
          auth: { autoRefreshToken: false, persistSession: false },
          global: {
            headers: { Authorization: `Bearer ${signIn.session.access_token}` },
          },
        },
      );

      const { error: updateError } = await lawyerClient
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", victim.data!.id);

      expect(updateError).toBeTruthy();
    },
    120_000,
  );
});
