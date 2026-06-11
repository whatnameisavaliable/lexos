import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildOperationsLogReadiness,
  formatOperationsLogReadiness,
  operationsLogRequirements,
} from "../src/lib/operations/operations-log.ts";

function opsEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("运维日志核对", () => {
  it("默认生成可交接的运维日志制度清单", () => {
    const readiness = buildOperationsLogReadiness({
      env: opsEnv(),
      generatedAt: new Date("2026-06-10T09:00:00.000Z"),
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.retentionDays, 365);
    assert.equal(readiness.reviewIntervalDays, 30);
    assert.equal(readiness.requirements.length, operationsLogRequirements.length);
    assert.equal(readiness.warnings.some((warning) => warning.includes("责任人")), true);
  });

  it("保留期过短或复核周期过长时阻断", () => {
    const readiness = buildOperationsLogReadiness({
      env: opsEnv({
        LEXOS_OPERATIONS_LOG_RETENTION_DAYS: "30",
        LEXOS_OPERATIONS_LOG_REVIEW_INTERVAL_DAYS: "120",
      }),
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.length, 2);
  });

  it("提示不要把运维日志放到公开静态目录", () => {
    const readiness = buildOperationsLogReadiness({
      env: opsEnv({
        LEXOS_OPERATIONS_LOG_DIR: "public/ops",
      }),
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.warnings.some((warning) => warning.includes("静态托管")), true);
  });

  it("格式化输出包含必记事件和禁止记录项", () => {
    const markdown = formatOperationsLogReadiness(buildOperationsLogReadiness({
      env: opsEnv({
        LEXOS_OPERATIONS_LOG_OWNER: "运维负责人",
      }),
    }));

    assert.match(markdown, /运维日志核对/);
    assert.match(markdown, /数据库迁移/);
    assert.match(markdown, /禁止记录/);
    assert.match(markdown, /客户大屏 token 明文/);
  });
});
