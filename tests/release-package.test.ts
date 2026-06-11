import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildReleasePackageCheck,
  formatReleasePackageCheck,
  type ReleasePackageInventory,
} from "../src/lib/deployment/release-package.ts";
import { requiredPrivateMigrationFiles } from "../src/lib/deployment/private-readiness.ts";

const readyInventory: ReleasePackageInventory = {
  directories: [
    "app",
    "src",
    "scripts",
    "tests",
    "docs",
    "supabase/migrations",
  ],
  docs: [
    "docs/deployment.md",
    "docs/private-deployment.md",
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
    "docs/backup-restore.md",
    "docs/storage-backup.md",
    "docs/backup-operations.md",
    "docs/backup-task-installation.md",
    "docs/backup-run-evidence.md",
    "docs/backup-encryption.md",
    "docs/backup-alerts.md",
    "docs/backup-mirror.md",
    "docs/operations-log.md",
    "docs/error-log.md",
    "docs/performance-monitoring.md",
    "docs/tenant-isolation.md",
    "docs/testing.md",
    "docs/database.md",
  ],
  migrationFiles: [...requiredPrivateMigrationFiles],
  packageScripts: [
    "build",
    "start",
    "verify",
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
  rootFiles: [
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "eslint.config.mjs",
    "playwright.config.ts",
    "playwright.preview.config.ts",
    ".vercelignore",
    ".env.example",
    "README.md",
  ],
};

function releaseEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    LEXOS_RELEASE_PACKAGE_MAINTAINER: "交付负责人",
    LEXOS_RELEASE_PACKAGE_TARGET_ENV: "律所验收环境",
    LEXOS_RELEASE_PACKAGE_VERSION: "v1.0-rc1",
    NODE_ENV: "test",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("私有化交付包清单核对", () => {
  it("交付元数据、根文件、目录、脚本、迁移和文档齐全时通过", () => {
    const check = buildReleasePackageCheck({
      env: releaseEnv(),
      generatedAt: new Date("2026-06-10T00:00:00.000Z"),
      inventory: readyInventory,
    });

    assert.equal(check.ok, true);
    assert.deepEqual(check.blockers, []);
    assert.deepEqual(check.rootFileSummary.missing, []);
    assert.deepEqual(check.directorySummary.missing, []);
    assert.deepEqual(check.scriptSummary.missing, []);
    assert.deepEqual(check.migrationSummary.missing, []);
    assert.deepEqual(check.docSummary.missing, []);
    assert.equal(formatReleasePackageCheck(check).includes("Lexos 私有化交付包清单核对"), true);
  });

  it("缺少版本、目标环境或维护人时阻断", () => {
    const check = buildReleasePackageCheck({
      env: releaseEnv({
        LEXOS_RELEASE_PACKAGE_MAINTAINER: "",
        LEXOS_RELEASE_PACKAGE_TARGET_ENV: "",
        LEXOS_RELEASE_PACKAGE_VERSION: "",
      }),
      inventory: readyInventory,
    });

    assert.equal(check.ok, false);
    assert.equal(check.blockers.some((blocker) => blocker.includes("发布版本")), true);
    assert.equal(check.blockers.some((blocker) => blocker.includes("目标环境")), true);
    assert.equal(check.blockers.some((blocker) => blocker.includes("交付维护人")), true);
  });

  it("缺少交付根文件、目录、脚本、迁移或文档时阻断", () => {
    const check = buildReleasePackageCheck({
      env: releaseEnv(),
      inventory: {
        directories: ["app"],
        docs: ["docs/deployment.md"],
        migrationFiles: ["20260606020954_init_lexos_schema.sql"],
        packageScripts: ["build"],
        rootFiles: ["package.json"],
      },
    });

    assert.equal(check.ok, false);
    assert.equal(check.rootFileSummary.missing.includes("README.md"), true);
    assert.equal(check.directorySummary.missing.includes("src"), true);
    assert.equal(check.scriptSummary.missing.includes("release:package:check"), true);
    assert.equal(check.migrationSummary.missing.includes("20260609165248_add_fund_transactions.sql"), true);
    assert.equal(check.docSummary.missing.includes("docs/release-package.md"), true);
  });

  it("版本或环境含敏感线索时阻断", () => {
    const check = buildReleasePackageCheck({
      env: releaseEnv({
        LEXOS_RELEASE_PACKAGE_TARGET_ENV: "secret-token-env",
      }),
      inventory: readyInventory,
    });

    assert.equal(check.ok, false);
    assert.equal(check.blockers.some((blocker) => blocker.includes("不能包含 token")), true);
  });

  it("工作区存在应排除路径时只提示，不阻断", () => {
    const cwd = path.join(os.tmpdir(), `lexos-release-package-${Date.now()}`);

    mkdirSync(path.join(cwd, "reports"), { recursive: true });

    try {
      const check = buildReleasePackageCheck({
        cwd,
        env: releaseEnv(),
        inventory: readyInventory,
      });

      assert.equal(check.ok, true);
      assert.equal(check.warnings.some((warning) => warning.includes("reports")), true);
      assert.equal(check.excludedPaths.includes(".env.local"), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });
});
