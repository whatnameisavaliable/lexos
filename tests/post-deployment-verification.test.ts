import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPostDeploymentVerification,
  formatPostDeploymentVerification,
} from "../src/lib/deployment/post-deployment-verification.ts";

function postDeployEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    LEXOS_POST_DEPLOYMENT_BASE_URL: "https://lexos.example.com",
    LEXOS_POST_DEPLOYMENT_ENVIRONMENT: "律所生产环境",
    LEXOS_POST_DEPLOYMENT_OBSERVATION_OWNER: "运维负责人",
    LEXOS_POST_DEPLOYMENT_OWNER: "交付负责人",
    LEXOS_POST_DEPLOYMENT_RELEASE_VERSION: "v1.0-rc1",
    LEXOS_POST_DEPLOYMENT_ROLLBACK_REF: "rollback-20260610",
    NODE_ENV: "test",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("部署后回归核对清单", () => {
  it("部署后元数据完整时通过并生成必需核对项", () => {
    const report = buildPostDeploymentVerification({
      env: postDeployEnv(),
      generatedAt: new Date("2026-06-10T16:00:00.000Z"),
    });

    assert.equal(report.ok, true);
    assert.equal(report.kind, "lexos-post-deployment-verification");
    assert.equal(report.blockers.length, 0);
    assert.equal(report.summary.required, report.items.length);
    assert.equal(report.summary.writesData, 1);
    assert.equal(report.items.some((item) => item.id === "real-smoke" && item.writesData), true);
    assert.equal(report.items.some((item) => item.command === "npm.cmd run final:gate:check && npm.cmd run handover:evidence:check"), true);
  });

  it("缺少负责人、环境、版本、地址或回滚引用时阻断", () => {
    const report = buildPostDeploymentVerification({
      env: postDeployEnv({
        LEXOS_POST_DEPLOYMENT_BASE_URL: "",
        LEXOS_POST_DEPLOYMENT_ENVIRONMENT: "",
        LEXOS_POST_DEPLOYMENT_OWNER: "",
        LEXOS_POST_DEPLOYMENT_RELEASE_VERSION: "",
        LEXOS_POST_DEPLOYMENT_ROLLBACK_REF: "",
      }),
    });

    assert.equal(report.ok, false);
    assert.equal(report.blockers.some((blocker) => blocker.includes("LEXOS_POST_DEPLOYMENT_OWNER")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("LEXOS_POST_DEPLOYMENT_ENVIRONMENT")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("LEXOS_POST_DEPLOYMENT_RELEASE_VERSION")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("LEXOS_POST_DEPLOYMENT_BASE_URL")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("LEXOS_POST_DEPLOYMENT_ROLLBACK_REF")), true);
  });

  it("地址格式错误或元数据含敏感线索时阻断", () => {
    const invalidUrl = buildPostDeploymentVerification({
      env: postDeployEnv({
        LEXOS_POST_DEPLOYMENT_BASE_URL: "lexos.example.com",
      }),
    });
    const secretRef = buildPostDeploymentVerification({
      env: postDeployEnv({
        LEXOS_POST_DEPLOYMENT_ROLLBACK_REF: "secret-token-rollback",
      }),
    });

    assert.equal(invalidUrl.ok, false);
    assert.equal(invalidUrl.blockers.some((blocker) => blocker.includes("URL")), true);
    assert.equal(secretRef.ok, false);
    assert.equal(secretRef.blockers.some((blocker) => blocker.includes("token")), true);
  });

  it("本机地址只提示不阻断", () => {
    const report = buildPostDeploymentVerification({
      env: postDeployEnv({
        LEXOS_POST_DEPLOYMENT_BASE_URL: "http://localhost:3005",
      }),
    });

    assert.equal(report.ok, true);
    assert.equal(report.warnings.some((warning) => warning.includes("本机地址")), true);
  });

  it("Markdown 输出包含标题、命令、写数据边界和暂缓功能边界", () => {
    const markdown = formatPostDeploymentVerification(buildPostDeploymentVerification({
      env: postDeployEnv(),
      generatedAt: new Date("2026-06-10T16:00:00.000Z"),
    }));

    assert.match(markdown, /Lexos 部署后回归核对清单/);
    assert.match(markdown, /npm\.cmd run postdeploy:check/);
    assert.match(markdown, /写入数据：是/);
    assert.match(markdown, /真实短信、新手保护期、新兵引流池、证据矩阵和 AI 辅助功能仍不在本期交付范围/);
  });
});
