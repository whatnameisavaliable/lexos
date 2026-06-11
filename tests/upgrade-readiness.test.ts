import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildUpgradeReadinessPlan,
  formatUpgradeReadinessMarkdown,
  parseAppliedMigrations,
} from "../src/lib/deployment/upgrade-readiness.ts";
import { requiredPrivateMigrationFiles, type PrivateReadinessInventory } from "../src/lib/deployment/private-readiness.ts";

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
  migrationFiles: [
    "20260606105523_lexos_online_compatibility_bootstrap.sql",
    ...requiredPrivateMigrationFiles,
  ],
  packageScripts: [
    "backup:db",
    "backup:rehearsal",
    "backup:encrypt:check",
    "backup:alert:check",
    "backup:mirror:check",
    "backup:schedule",
    "backup:task:check",
    "backup:run:check",
    "backup:storage",
    "build",
    "deploy:channel:check",
    "deploy:upload:check",
    "deploy:preview:request",
    "deploy:preview:evidence",
    "launch:check",
    "private:check",
    "restore:db",
    "restore:storage",
    "seed:admin",
    "smoke:real",
    "start",
    "test:e2e",
    "upgrade:check",
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
    "verify",
    "verify:rls",
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

describe("升级迁移核对", () => {
  it("解析已应用迁移清单，并自动补齐 .sql 后缀", () => {
    assert.deepEqual(parseAppliedMigrations("20260606020954_init_lexos_schema, 20260606133522_lock_down_direct_table_access.sql"), [
      "20260606020954_init_lexos_schema.sql",
      "20260606133522_lock_down_direct_table_access.sql",
    ]);
  });

  it("前置脚本、文档和迁移齐全时生成升级计划", () => {
    const plan = buildUpgradeReadinessPlan({
      cwd: process.cwd(),
      env: privateEnv({
        LEXOS_UPGRADE_APPLIED_MIGRATIONS: requiredPrivateMigrationFiles.join(","),
        LEXOS_UPGRADE_FROM_VERSION: "0.0.9",
        LEXOS_UPGRADE_TARGET_VERSION: "0.1.0",
      }),
      generatedAt: new Date("2026-06-10T08:30:00.000Z"),
      inventory: readyInventory,
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.fromVersion, "0.0.9");
    assert.equal(plan.targetVersion, "0.1.0");
    assert.equal(plan.migrationSummary.applied, requiredPrivateMigrationFiles.length);
    assert.equal(plan.migrationSummary.pending, 0);
  });

  it("未提供已应用迁移时标记为人工核对而不阻断", () => {
    const plan = buildUpgradeReadinessPlan({
      env: privateEnv(),
      inventory: readyInventory,
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.appliedMigrationSource, "none");
    assert.equal(plan.migrationSummary.manualCheck, requiredPrivateMigrationFiles.length);
  });

  it("缺少必需迁移或脚本时阻断", () => {
    const plan = buildUpgradeReadinessPlan({
      env: privateEnv(),
      inventory: {
        ...readyInventory,
        migrationFiles: ["20260606020954_init_lexos_schema.sql"],
        packageScripts: readyInventory.packageScripts.filter((scriptName) => scriptName !== "verify:rls"),
      },
    });

    assert.equal(plan.ok, false);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("verify:rls")), true);
    assert.equal(plan.migrationSummary.missingRequired.includes("20260609165248_add_fund_transactions.sql"), true);
  });

  it("格式化输出包含备份、迁移和回滚证据", () => {
    const markdown = formatUpgradeReadinessMarkdown(buildUpgradeReadinessPlan({
      env: privateEnv(),
      inventory: readyInventory,
    }));

    assert.match(markdown, /升级迁移核对计划/);
    assert.match(markdown, /npm\.cmd run backup:db/);
    assert.match(markdown, /supabase db push/);
    assert.match(markdown, /回滚证据/);
  });
});
