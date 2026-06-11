import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLaunchReadinessRunbook,
  formatLaunchReadinessMarkdown,
} from "../src/lib/deployment/launch-readiness.ts";
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
  migrationFiles: [...requiredPrivateMigrationFiles],
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
    "final:acceptance",
    "final:acceptance:archive",
    "final:gate:check",
    "handover:evidence:check",
    "postdeploy:check",
    "release:package:check",
    "release:sensitive:check",
    "upgrade:check",
    "ops:log:check",
    "error:log:check",
    "perf:check",
    "tenant:check",
    "restore:db",
    "restore:storage",
    "seed:admin",
    "smoke:real",
    "start",
    "test:e2e",
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

describe("上线前核对 runbook", () => {
  it("在私有化前置条件齐全时生成完整核对阶段", () => {
    const runbook = buildLaunchReadinessRunbook({
      env: privateEnv(),
      generatedAt: new Date("2026-06-10T08:00:00.000Z"),
      inventory: readyInventory,
    });

    assert.equal(runbook.ok, true);
    assert.equal(runbook.migrationSummary.present, requiredPrivateMigrationFiles.length);
    assert.equal(runbook.stages.length, 7);
    assert.equal(runbook.stages.some((stage) => stage.id === "migration-check"), true);
    assert.equal(runbook.stages.some((stage) => stage.id === "backup-rehearsal"), true);
  });

  it("缺少上线前脚本时阻断", () => {
    const runbook = buildLaunchReadinessRunbook({
      env: privateEnv(),
      inventory: {
        ...readyInventory,
        packageScripts: readyInventory.packageScripts.filter((scriptName) => scriptName !== "verify:rls"),
      },
    });

    assert.equal(runbook.ok, false);
    assert.equal(runbook.blockers.some((blocker) => blocker.includes("verify:rls")), true);
  });

  it("格式化输出包含只读边界和真实 smoke 写入提示", () => {
    const markdown = formatLaunchReadinessMarkdown(buildLaunchReadinessRunbook({
      env: privateEnv(),
      inventory: readyInventory,
    }));

    assert.match(markdown, /上线前核对 Runbook/);
    assert.match(markdown, /只读或仅生成计划/);
    assert.match(markdown, /会写入客户、任务、反馈和结算记录/);
  });
});
