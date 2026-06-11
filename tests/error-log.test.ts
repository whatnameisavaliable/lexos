import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildErrorLogReadiness,
  formatErrorLogReadiness,
  redactErrorLogMetadata,
} from "../src/lib/operations/error-log.ts";

function errorEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("错误日志核对", () => {
  it("默认生成可交接的错误日志分级清单", () => {
    const readiness = buildErrorLogReadiness({
      env: errorEnv(),
      generatedAt: new Date("2026-06-10T10:00:00.000Z"),
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.retentionDays, 180);
    assert.equal(readiness.alertCritical, true);
    assert.equal(readiness.requirements.some((item) => item.category === "database"), true);
  });

  it("保留期过短或日志目标公开时阻断", () => {
    const readiness = buildErrorLogReadiness({
      env: errorEnv({
        LEXOS_ERROR_LOG_DESTINATION: "public/errors",
        LEXOS_ERROR_LOG_RETENTION_DAYS: "30",
      }),
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.length, 2);
  });

  it("critical 告警关闭时提示但不阻断", () => {
    const readiness = buildErrorLogReadiness({
      env: errorEnv({
        LEXOS_ERROR_LOG_ALERT_CRITICAL: "false",
      }),
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.warnings.some((warning) => warning.includes("critical")), true);
  });

  it("脱敏敏感 key 和手机号", () => {
    const redacted = redactErrorLogMetadata({
      customerPhone: "13800000000",
      nested: {
        token: "secret-token",
      },
      password: "123456",
    });

    assert.equal(redacted.customerPhone, "138****0000");
    assert.deepEqual(redacted.nested, { token: "[已脱敏]" });
    assert.equal(redacted.password, "[已脱敏]");
  });

  it("格式化输出包含分类和脱敏规则", () => {
    const markdown = formatErrorLogReadiness(buildErrorLogReadiness({
      env: errorEnv(),
    }));

    assert.match(markdown, /错误日志核对/);
    assert.match(markdown, /数据库与 RLS 异常/);
    assert.match(markdown, /脱敏规则/);
    assert.match(markdown, /service role key/);
  });
});
