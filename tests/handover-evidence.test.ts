import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildHandoverEvidenceIndex,
  formatHandoverEvidenceIndex,
} from "../src/lib/deployment/handover-evidence.ts";

function handoverEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    LEXOS_HANDOVER_CLIENT_SIGNOFF_REF: "signoff-20260610",
    LEXOS_HANDOVER_OPERATIONS_OWNER: "运维负责人",
    LEXOS_HANDOVER_OWNER: "交付负责人",
    LEXOS_HANDOVER_RELEASE_APPROVER: "发布批准人",
    LEXOS_HANDOVER_SECURITY_REVIEWER: "安全复核人",
    NODE_ENV: "test",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("最终交付证据索引", () => {
  it("交付负责人和客户签收引用完整时通过", () => {
    const index = buildHandoverEvidenceIndex({
      env: handoverEnv(),
      generatedAt: new Date("2026-06-10T16:00:00.000Z"),
    });

    assert.equal(index.ok, true);
    assert.equal(index.kind, "lexos-handover-evidence-index");
    assert.equal(index.blockers.length, 0);
    assert.equal(index.summary.required, index.items.length);
    assert.equal(index.summary.writesData, 1);
    assert.equal(index.items.some((item) => item.id === "real-smoke" && item.writesData), true);
    assert.equal(index.items.some((item) => item.command === "npm.cmd run release:package:check && npm.cmd run release:sensitive:check"), true);
  });

  it("缺少交付负责人或客户签收引用时阻断", () => {
    const index = buildHandoverEvidenceIndex({
      env: handoverEnv({
        LEXOS_HANDOVER_CLIENT_SIGNOFF_REF: "",
        LEXOS_HANDOVER_OWNER: "",
      }),
    });

    assert.equal(index.ok, false);
    assert.equal(index.blockers.some((blocker) => blocker.includes("LEXOS_HANDOVER_OWNER")), true);
    assert.equal(index.blockers.some((blocker) => blocker.includes("LEXOS_HANDOVER_CLIENT_SIGNOFF_REF")), true);
  });

  it("客户签收引用不能包含疑似密钥或短信服务线索", () => {
    const index = buildHandoverEvidenceIndex({
      env: handoverEnv({
        LEXOS_HANDOVER_CLIENT_SIGNOFF_REF: "secret-token-signoff",
      }),
    });

    assert.equal(index.ok, false);
    assert.equal(index.blockers.some((blocker) => blocker.includes("token")), true);
  });

  it("Markdown 输出包含证据索引标题、真实 smoke 和暂停功能边界", () => {
    const markdown = formatHandoverEvidenceIndex(buildHandoverEvidenceIndex({
      env: handoverEnv(),
      generatedAt: new Date("2026-06-10T16:00:00.000Z"),
    }));

    assert.match(markdown, /Lexos 最终交付证据索引/);
    assert.match(markdown, /npm\.cmd run smoke:real/);
    assert.match(markdown, /写入数据：是/);
    assert.match(markdown, /真实短信、新手保护期、新兵引流池、证据矩阵和 AI 辅助功能仍不在本期交付范围/);
  });
});
