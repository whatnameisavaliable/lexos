import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPrivateDeploymentReadiness,
  getPrivateDeploymentMode,
  requiredPrivateMigrationFiles,
  type PrivateReadinessInventory,
} from "../src/lib/deployment/private-readiness.ts";

const readyInventory: PrivateReadinessInventory = {
  docs: [
    "docs/deployment.md",
    "docs/private-deployment.md",
    "docs/backup-restore.md",
    "docs/storage-backup.md",
    "docs/backup-operations.md",
    "docs/backup-task-installation.md",
    "docs/backup-run-evidence.md",
    "docs/backup-encryption.md",
    "docs/backup-alerts.md",
    "docs/backup-mirror.md",
    "docs/launch-readiness.md",
    "docs/upgrade-runbook.md",
    "docs/deployment-channel.md",
    "docs/vercel-upload-package.md",
    "docs/vercel-preview-request.md",
    "docs/vercel-preview-evidence.md",
    "docs/final-deployment-acceptance.md",
    "docs/final-gate.md",
    "docs/handover-evidence.md",
    "docs/post-deployment-verification.md",
    "docs/release-package.md",
    "docs/release-sensitive-scan.md",
    "docs/operations-log.md",
    "docs/error-log.md",
    "docs/performance-monitoring.md",
    "docs/tenant-isolation.md",
    "docs/database.md",
    "docs/testing.md",
  ],
  migrationFiles: [...requiredPrivateMigrationFiles],
  packageScripts: [
    "build",
    "start",
    "private:check",
    "launch:check",
    "upgrade:check",
    "deploy:channel:check",
    "deploy:upload:check",
    "deploy:preview:request",
    "deploy:preview:evidence",
    "final:acceptance",
    "final:acceptance:archive",
    "final:gate:check",
    "handover:evidence:check",
    "postdeploy:check",
    "release:package:check",
    "release:sensitive:check",
    "ops:log:check",
    "error:log:check",
    "perf:check",
    "tenant:check",
    "backup:db",
    "restore:db",
    "backup:storage",
    "restore:storage",
    "backup:schedule",
    "backup:task:check",
    "backup:run:check",
    "backup:rehearsal",
    "backup:encrypt:check",
    "backup:alert:check",
    "backup:mirror:check",
    "seed:admin",
    "verify:rls",
    "smoke:real",
  ],
};

function privateEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    LEXOS_AUTH_EMAIL_DOMAIN: "lexos.local",
    LEXOS_DEFAULT_ORGANIZATION_ID: "00000000-0000-0000-0000-000000000001",
    NEXT_PUBLIC_DEMO_MODE: "false",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("私有化部署自检", () => {
  it("真实 Supabase 模式、关键脚本、迁移和文档齐全时通过", () => {
    const env = privateEnv();
    const readiness = buildPrivateDeploymentReadiness(env, readyInventory);

    assert.equal(getPrivateDeploymentMode(env), "supabase");
    assert.equal(readiness.ok, true);
    assert.equal(readiness.supabaseConfigured, true);
    assert.deepEqual(readiness.blockers, []);
    assert.deepEqual(readiness.migrationSummary.missing, []);
    assert.deepEqual(readiness.scriptSummary.missing, []);
    assert.deepEqual(readiness.docSummary.missing, []);
  });

  it("内存 demo 模式不能作为私有化正式交付环境", () => {
    const readiness = buildPrivateDeploymentReadiness(privateEnv({ NEXT_PUBLIC_DEMO_MODE: "true" }), readyInventory);

    assert.equal(readiness.ok, false);
    assert.equal(readiness.mode, "demo");
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("不能使用内存 demo 模式")), true);
  });

  it("缺少 Supabase 必要变量时不通过", () => {
    const readiness = buildPrivateDeploymentReadiness(
      privateEnv({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
      }),
      readyInventory,
    );

    assert.equal(readiness.ok, false);
    assert.deepEqual(readiness.missingRequiredEnvKeys, [
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
  });

  it("发现 NEXT_PUBLIC service role 或 secret 变量时不通过", () => {
    const readiness = buildPrivateDeploymentReadiness(
      privateEnv({
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "leaked-service-role",
      }),
      readyInventory,
    );

    assert.equal(readiness.ok, false);
    assert.deepEqual(readiness.publicSecretEnvKeys, ["NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"]);
  });

  it("service role 与 anon key 相同时不通过", () => {
    const readiness = buildPrivateDeploymentReadiness(
      privateEnv({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "same-key",
        SUPABASE_SERVICE_ROLE_KEY: "same-key",
      }),
      readyInventory,
    );

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("不能相同")), true);
  });

  it("缺失关键迁移、脚本或文档时不通过", () => {
    const readiness = buildPrivateDeploymentReadiness(privateEnv(), {
      docs: ["docs/deployment.md"],
      migrationFiles: ["20260606020954_init_lexos_schema.sql"],
      packageScripts: ["build"],
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.migrationSummary.missing.includes("20260609165248_add_fund_transactions.sql"), true);
    assert.equal(readiness.scriptSummary.missing.includes("verify:rls"), true);
    assert.equal(readiness.docSummary.missing.includes("docs/private-deployment.md"), true);
  });

  it("Supabase URL 误填 REST endpoint 时给出提示但不阻断", () => {
    const readiness = buildPrivateDeploymentReadiness(
      privateEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/rest/v1/",
      }),
      readyInventory,
    );

    assert.equal(readiness.ok, true);
    assert.equal(readiness.warnings.some((warning) => warning.includes("/rest/v1")), true);
  });
});
