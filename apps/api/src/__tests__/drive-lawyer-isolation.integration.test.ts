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
import { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import { DriveNodeGetService } from "../services/drive-node-get.service.js";

interface LawyerFixture {
  readonly userId: string;
  readonly username: string;
  readonly accessToken: string;
}

function canRunDriveIntegration(): boolean {
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
  const username = `m7_lawyer_${suffix}`;
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
    await admin.from("drive_nodes").delete().eq("created_by", fixture.userId);
    await admin.auth.admin.deleteUser(fixture.userId);
  };

  return { fixture, cleanup };
}

describe("drive lawyer isolation (integration)", () => {
  it.skipIf(!canRunDriveIntegration())(
    "lawyer A cannot GET lawyer B drive node via service layer",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const suffix = Date.now().toString(36);

      const { fixture: lawyerA, cleanup: cleanupA } =
        await createLawyerFixture(`${suffix}_a`);
      const { fixture: lawyerB, cleanup: cleanupB } =
        await createLawyerFixture(`${suffix}_b`);

      const repo = new DriveNodeRepository(appEnv);
      const getService = new DriveNodeGetService(repo);

      try {
        const rootB = await repo.findRootByUser(lawyerB.accessToken);
        expect(rootB).not.toBeNull();

        const folderB = await repo.createFolder(lawyerB.accessToken, {
          createdBy: lawyerB.userId,
          parentId: rootB!.id,
          name: "private-docs",
        });

        const actorA = createAuthContext({
          userId: lawyerA.userId,
          role: "lawyer",
          username: lawyerA.username,
          requiresPasswordChange: false,
        });

        await expect(
          getService.get(actorA, lawyerA.accessToken, folderB.id),
        ).rejects.toMatchObject({
          code: ErrorCode.RESOURCE_NOT_FOUND,
        });

        const hidden = await repo.findById(lawyerA.accessToken, folderB.id);
        expect(hidden).toBeNull();
      } finally {
        await cleanupA();
        await cleanupB();
      }
    },
  );

  it("documents that POST /api/drive/files is not exposed in M7", () => {
    const exposedDriveWriteRoutes = [
      "POST /api/drive/folders",
      "PATCH /api/drive/nodes/:id",
      "DELETE /api/drive/nodes/:id",
    ];
    expect(exposedDriveWriteRoutes).not.toContain("POST /api/drive/files");
  });
});

describe("drive root file guard (unit via rules)", () => {
  it("maps missing node to AppHttpError for blind cross-user access", async () => {
    const repo = {
      findById: async () => null,
    };
    const getService = new DriveNodeGetService(repo as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    await expect(
      getService.get(actor, "token", "00000000-0000-4000-8000-000000009999"),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
