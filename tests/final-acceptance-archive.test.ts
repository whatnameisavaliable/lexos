import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildFinalDeploymentAcceptance,
  requiredFinalAcceptanceDocs,
  requiredFinalAcceptanceScripts,
} from "../src/lib/deployment/final-acceptance.ts";
import {
  buildFinalAcceptanceArchivePlan,
  formatFinalAcceptanceArchivePlan,
  getFinalAcceptanceArchiveConfigFromEnv,
  writeFinalAcceptanceArchive,
} from "../src/lib/deployment/final-acceptance-archive.ts";
import { requiredPrivateMigrationFiles, type PrivateReadinessInventory } from "../src/lib/deployment/private-readiness.ts";

const readyInventory: PrivateReadinessInventory = {
  docs: [
    ...requiredFinalAcceptanceDocs,
    "docs/database.md",
  ],
  migrationFiles: [...requiredPrivateMigrationFiles],
  packageScripts: [
    ...requiredFinalAcceptanceScripts,
    "final:acceptance:archive",
    "start",
    "seed:admin",
  ],
};

function acceptanceEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    LEXOS_AUTH_EMAIL_DOMAIN: "lexos.local",
    LEXOS_DEFAULT_ORGANIZATION_ID: "00000000-0000-0000-0000-000000000001",
    LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT: "验收环境",
    LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF: "acceptance-20260610",
    LEXOS_FINAL_ACCEPTANCE_OWNER: "交付负责人",
    LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION: "v1.0-rc1",
    NEXT_PUBLIC_DEMO_MODE: "false",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    ...values,
  } as NodeJS.ProcessEnv;
}

function buildReadyReport() {
  return buildFinalDeploymentAcceptance({
    env: acceptanceEnv(),
    generatedAt: new Date("2026-06-10T13:30:00.000Z"),
    inventory: readyInventory,
  });
}

describe("最终验收证据包归档", () => {
  it("最终验收通过时写入 Markdown 和 JSON", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "lexos-final-archive-"));

    try {
      const plan = buildFinalAcceptanceArchivePlan({
        cwd: tempRoot,
        outputDir: "reports/final-acceptance",
        report: buildReadyReport(),
      });

      writeFinalAcceptanceArchive(plan);

      assert.equal(plan.blockers.length, 0);
      assert.equal(existsSync(plan.markdownPath), true);
      assert.equal(existsSync(plan.jsonPath), true);
      assert.match(readFileSync(plan.markdownPath, "utf8"), /最终部署验收报告/);
      assert.match(readFileSync(plan.jsonPath, "utf8"), /"kind": "lexos-final-deployment-acceptance"/);
    } finally {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  it("报告存在阻断项时不写入正式归档", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "lexos-final-archive-blocked-"));

    try {
      const blockedReport = buildFinalDeploymentAcceptance({
        env: acceptanceEnv({ LEXOS_FINAL_ACCEPTANCE_OWNER: "" }),
        inventory: readyInventory,
      });
      const plan = buildFinalAcceptanceArchivePlan({
        cwd: tempRoot,
        outputDir: "reports/final-acceptance",
        report: blockedReport,
      });

      writeFinalAcceptanceArchive(plan);

      assert.equal(plan.blockers.some((blocker) => blocker.includes("仍存在阻断项")), true);
      assert.equal(existsSync(plan.markdownPath), false);
    } finally {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  it("只演练模式不写入文件", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "lexos-final-archive-dry-"));

    try {
      const plan = buildFinalAcceptanceArchivePlan({
        cwd: tempRoot,
        outputDir: "reports/final-acceptance",
        report: buildReadyReport(),
        write: false,
      });

      writeFinalAcceptanceArchive(plan);

      assert.equal(plan.blockers.length, 0);
      assert.equal(plan.write, false);
      assert.equal(existsSync(plan.markdownPath), false);
      assert.match(formatFinalAcceptanceArchivePlan(plan), /演练通过/);
    } finally {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  it("拒绝工作区外、公有目录或疑似密钥目录", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "lexos-final-archive-path-"));

    try {
      const outside = buildFinalAcceptanceArchivePlan({
        cwd: tempRoot,
        outputDir: path.join(tempRoot, "..", "outside"),
        report: buildReadyReport(),
      });
      const publicDir = buildFinalAcceptanceArchivePlan({
        cwd: tempRoot,
        outputDir: "public/reports",
        report: buildReadyReport(),
      });
      const secretDir = buildFinalAcceptanceArchivePlan({
        cwd: tempRoot,
        outputDir: "reports/secret-token",
        report: buildReadyReport(),
      });

      assert.equal(outside.blockers.some((blocker) => blocker.includes("工作区内")), true);
      assert.equal(publicDir.blockers.some((blocker) => blocker.includes("可发布")), true);
      assert.equal(secretDir.blockers.some((blocker) => blocker.includes("不能包含 token")), true);
    } finally {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  it("从环境变量读取归档目录", () => {
    const config = getFinalAcceptanceArchiveConfigFromEnv({
      LEXOS_FINAL_ACCEPTANCE_ARCHIVE_DIR: "reports/custom-final",
      NODE_ENV: "test",
    });

    assert.equal(config.outputDir, "reports/custom-final");
  });
});
