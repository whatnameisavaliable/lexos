import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  loadAppRuntimeEnv,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  resolveRepoRoot,
  resolveVirtualEmail,
} from "../config/index.js";

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

describe("sop_templates RLS (integration)", () => {
  it.skipIf(() => !canRunSopRlsIntegration())(
    "lawyer can SELECT published template version but cannot INSERT sop_templates",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const authEnv = loadAuthSeedEnvFromProcess();

      const admin = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );

      const username = `m10_tpl_lawyer_${Date.now()}`;
      const email = resolveVirtualEmail(username, authEnv.authVirtualEmailDomain);
      const { data: userData, error: userError } =
        await admin.auth.admin.createUser({
          email,
          password: authEnv.authInitialPassword,
          email_confirm: true,
        });
      if (userError || !userData.user) {
        throw new Error(userError?.message);
      }

      await admin.from("profiles").insert({
        id: userData.user.id,
        username,
        display_name: username,
        role: "lawyer",
        status: "enabled",
        requires_password_change: false,
        mfa_enabled: false,
      });

      const { data: adminProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("username", "admin")
        .single();

      const templateId = crypto.randomUUID();
      const versionId = crypto.randomUUID();

      const anon = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: signIn } = await anon.auth.signInWithPassword({
        email,
        password: authEnv.authInitialPassword,
      });
      const lawyerClient = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization: `Bearer ${signIn!.session!.access_token}`,
            },
          },
          auth: { autoRefreshToken: false, persistSession: false },
        },
      );

      try {
        await admin.from("sop_templates").insert({
          id: templateId,
          name: "Published Template",
          case_type: "civil",
          created_by: adminProfile!.id,
        });
        await admin.from("sop_template_versions").insert({
          id: versionId,
          template_id: templateId,
          version_number: 1,
          is_published: true,
          created_by: adminProfile!.id,
        });

        const { data: published, error: selectError } = await lawyerClient
          .from("sop_template_versions")
          .select("id, is_published")
          .eq("id", versionId)
          .maybeSingle();

        expect(selectError).toBeNull();
        expect(published?.is_published).toBe(true);

        const { error: insertError } = await lawyerClient
          .from("sop_templates")
          .insert({
            name: "Lawyer Template",
            case_type: "civil",
            created_by: userData.user.id,
          });

        expect(insertError).not.toBeNull();
      } finally {
        await admin
          .from("sop_template_versions")
          .delete()
          .eq("id", versionId);
        await admin.from("sop_templates").delete().eq("id", templateId);
        await admin.auth.admin.deleteUser(userData.user.id);
      }
    },
  );

  it.skipIf(() => !canRunSopRlsIntegration())(
    "admin can INSERT sop_templates",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const authEnv = loadAuthSeedEnvFromProcess();

      const adminClient = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );

      const { data: adminProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", "admin")
        .single();

      const email = resolveVirtualEmail("admin", authEnv.authVirtualEmailDomain);
      const anon = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: signIn } = await anon.auth.signInWithPassword({
        email,
        password: authEnv.authInitialPassword,
      });

      const adminJwtClient = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization: `Bearer ${signIn!.session!.access_token}`,
            },
          },
          auth: { autoRefreshToken: false, persistSession: false },
        },
      );

      const templateId = crypto.randomUUID();
      try {
        const { data, error } = await adminJwtClient
          .from("sop_templates")
          .insert({
            id: templateId,
            name: "Admin Created Template",
            case_type: "criminal",
            created_by: adminProfile!.id,
          })
          .select("id")
          .single();

        expect(error).toBeNull();
        expect(data?.id).toBe(templateId);
      } finally {
        await adminClient.from("sop_templates").delete().eq("id", templateId);
      }
    },
  );
});
