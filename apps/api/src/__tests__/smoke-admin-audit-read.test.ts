import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  loadAppRuntimeEnv,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  resolveRepoRoot,
  resolveVirtualEmail,
} from "@lexos/shared/config";
import { AuditLogReadRepository } from "../repositories/audit-log-read.repository.js";
import { AuditLogListService } from "../services/audit-log-list.service.js";

function canRunAuditSmoke(): boolean {
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

async function signInAsRole(
  role: "admin" | "lawyer",
  suffix: string,
): Promise<{ accessToken: string; userId: string; cleanup: () => Promise<void> }> {
  const repoRoot = resolveRepoRoot();
  loadEnvFiles(repoRoot, [".env", ".env.development"]);
  const appEnv = loadAppRuntimeEnv(repoRoot);
  const authEnv = loadAuthSeedEnvFromProcess();
  const username = `m9_audit_${role}_${suffix}`;
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
    role,
    status: "enabled",
    requires_password_change: false,
    mfa_enabled: false,
  });

  if (role === "lawyer") {
    await admin.from("drive_nodes").insert({
      created_by: data.user.id,
      parent_id: null,
      node_type: "folder",
      name: "__root__",
    });
  }

  const anon = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signIn, error: signInError } =
    await anon.auth.signInWithPassword({ email, password });
  if (signInError || !signIn.session) {
    throw new Error(`signIn failed: ${signInError?.message}`);
  }

  const cleanup = async () => {
    if (role === "lawyer") {
      await admin.from("drive_nodes").delete().eq("created_by", data.user!.id);
    }
    await admin.auth.admin.deleteUser(data.user!.id);
  };

  return {
    accessToken: signIn.session.access_token,
    userId: data.user.id,
    cleanup,
  };
}

describe("smoke admin audit read (integration)", () => {
  it.skipIf(!canRunAuditSmoke())(
    "admin can list audit_logs via service layer",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);

      const adminUser = await signInAsRole("admin", suffix);
      const repo = new AuditLogReadRepository(appEnv);
      const listService = new AuditLogListService(repo);

      try {
        const page = await listService.list(adminUser.accessToken, {
          limit: 10,
        });
        expect(page.items).toBeDefined();
        expect(Array.isArray(page.items)).toBe(true);
      } finally {
        await adminUser.cleanup();
      }
    },
  );

  it.skipIf(!canRunAuditSmoke())(
    "lawyer receives empty audit_logs via RLS (non-admin cannot read)",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);

      const lawyer = await signInAsRole("lawyer", suffix);
      const repo = new AuditLogReadRepository(appEnv);
      const listService = new AuditLogListService(repo);

      try {
        const page = await listService.list(lawyer.accessToken, { limit: 10 });
        expect(page.items).toHaveLength(0);
      } finally {
        await lawyer.cleanup();
      }
    },
  );
});
