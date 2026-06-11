import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildFinalDeploymentAcceptance,
  formatFinalDeploymentAcceptance,
  getFinalAcceptanceConfigFromEnv,
  requiredFinalAcceptanceDocs,
  requiredFinalAcceptanceScripts,
} from "../src/lib/deployment/final-acceptance.ts";
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

describe("最终部署验收", () => {
  it("脚本、文档、环境变量和验收元数据齐全时通过", () => {
    const report = buildFinalDeploymentAcceptance({
      env: acceptanceEnv(),
      generatedAt: new Date("2026-06-10T13:00:00.000Z"),
      inventory: readyInventory,
    });

    assert.equal(report.ok, true);
    assert.equal(report.owner, "交付负责人");
    assert.equal(report.environment, "验收环境");
    assert.equal(report.sections.length, 9);
    assert.deepEqual(report.scriptSummary.missing, []);
    assert.deepEqual(report.docSummary.missing, []);
  });

  it("缺少验收元数据时阻断", () => {
    const report = buildFinalDeploymentAcceptance({
      env: acceptanceEnv({
        LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT: "",
        LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF: "",
        LEXOS_FINAL_ACCEPTANCE_OWNER: "",
        LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION: "",
      }),
      inventory: readyInventory,
    });

    assert.equal(report.ok, false);
    assert.equal(report.blockers.some((blocker) => blocker.includes("验收负责人")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("目标环境")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("发布版本")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("证据归档")), true);
  });

  it("缺少最终验收脚本或文档时阻断", () => {
    const report = buildFinalDeploymentAcceptance({
      env: acceptanceEnv(),
      inventory: {
        ...readyInventory,
        docs: readyInventory.docs.filter((docPath) => docPath !== "docs/backup-mirror.md"),
        packageScripts: readyInventory.packageScripts.filter((scriptName) => scriptName !== "backup:mirror:check"),
      },
    });

    assert.equal(report.ok, false);
    assert.deepEqual(report.scriptSummary.missing, ["backup:mirror:check"]);
    assert.deepEqual(report.docSummary.missing, ["docs/backup-mirror.md"]);
  });

  it("证据归档编号疑似包含密钥时阻断", () => {
    const report = buildFinalDeploymentAcceptance({
      env: acceptanceEnv({
        LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF: "secret-token-archive",
      }),
      inventory: readyInventory,
    });

    assert.equal(report.ok, false);
    assert.equal(report.blockers.some((blocker) => blocker.includes("不能包含 token")), true);
  });

  it("格式化输出包含核心验收阶段和暂缓范围", () => {
    const markdown = formatFinalDeploymentAcceptance(buildFinalDeploymentAcceptance({
      env: acceptanceEnv(),
      inventory: readyInventory,
    }));

    assert.match(markdown, /最终部署验收报告/);
    assert.match(markdown, /质量门槛/);
    assert.match(markdown, /迁移与安全边界/);
    assert.match(markdown, /真实闭环 smoke/);
    assert.match(markdown, /不开发真实短信、证据矩阵、AI 辅助/);
  });

  it("从环境变量读取验收元数据", () => {
    const config = getFinalAcceptanceConfigFromEnv(acceptanceEnv({
      LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION: "v1.0",
    }));

    assert.equal(config.releaseVersion, "v1.0");
    assert.equal(config.owner, "交付负责人");
  });
});
