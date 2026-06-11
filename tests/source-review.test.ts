import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { averageScores, validateSourceReviewInput } from "../src/lib/reviews/source-review.ts";

describe("案源验收评分输入", () => {
  it("标准化评分与评语输入", () => {
    const draft = validateSourceReviewInput({
      caseResultScore: "8",
      caseResultSummary: "  已形成可交付结果  ",
      sourceReviewComment: "  结构清楚，风险提示完整  ",
      sourceReviewScore: "9",
    });

    assert.deepEqual(draft, {
      caseResultScore: 8,
      caseResultSummary: "已形成可交付结果",
      sourceReviewComment: "结构清楚，风险提示完整",
      sourceReviewScore: 9,
    });
  });

  it("拒绝 1 到 10 之外或非整数评分", () => {
    assert.throws(() => validateSourceReviewInput({ sourceReviewScore: 11 }), /1.*10/);
    assert.throws(() => validateSourceReviewInput({ caseResultScore: 8.5 }), /1.*10/);
  });

  it("按一位小数计算有效评分平均值", () => {
    assert.equal(averageScores([10, 9, undefined, null, 8]), 9);
    assert.equal(averageScores([10, 9, 9]), 9.3);
    assert.equal(averageScores([undefined, null]), null);
  });
});
