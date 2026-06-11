import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPerformanceMonitoringReadiness,
  formatPerformanceMonitoringReadiness,
  performanceMetricRequirements,
} from "../src/lib/operations/performance-monitoring.ts";

function perfEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("性能监控核对", () => {
  it("默认生成可交接的性能指标清单", () => {
    const readiness = buildPerformanceMonitoringReadiness({
      env: perfEnv(),
      generatedAt: new Date("2026-06-10T11:00:00.000Z"),
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.reviewIntervalDays, 30);
    assert.equal(readiness.sampleRetentionDays, 180);
    assert.equal(readiness.requirements.length, performanceMetricRequirements.length);
  });

  it("复核周期过长或样本保留期过短时阻断", () => {
    const readiness = buildPerformanceMonitoringReadiness({
      env: perfEnv({
        LEXOS_PERFORMANCE_REVIEW_INTERVAL_DAYS: "120",
        LEXOS_PERFORMANCE_SAMPLE_RETENTION_DAYS: "30",
      }),
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.length, 2);
  });

  it("未设置责任人时提示但不阻断", () => {
    const readiness = buildPerformanceMonitoringReadiness({
      env: perfEnv(),
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.warnings.some((warning) => warning.includes("责任人")), true);
  });

  it("格式化输出包含 Web、API、数据库和容量指标", () => {
    const markdown = formatPerformanceMonitoringReadiness(buildPerformanceMonitoringReadiness({
      env: perfEnv({
        LEXOS_PERFORMANCE_OWNER: "性能负责人",
      }),
    }));

    assert.match(markdown, /性能监控核对/);
    assert.match(markdown, /前端核心体验/);
    assert.match(markdown, /核心 API 延迟/);
    assert.match(markdown, /容量与增长/);
  });
});
