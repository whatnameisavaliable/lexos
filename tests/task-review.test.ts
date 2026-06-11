import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canReviewTask, isTaskReviewSatisfied, validateTaskReviewInput } from "../src/lib/tasks/review.ts";

describe("审核律师流程", () => {
  it("主任可以审核分配给自己的待复核任务", () => {
    assert.equal(
      canReviewTask({
        currentUserId: "u-director",
        reviewLawyerId: "u-director",
        reviewRequired: true,
        reviewStatus: "pending",
        taskStatus: "submitted",
        userRole: "director",
      }),
      true,
    );
  });

  it("普通律师和非待审核任务不能执行审核", () => {
    assert.equal(
      canReviewTask({
        currentUserId: "u-handler",
        reviewRequired: true,
        reviewStatus: "pending",
        taskStatus: "submitted",
        userRole: "handling_lawyer",
      }),
      false,
    );
    assert.equal(
      canReviewTask({
        currentUserId: "u-director",
        reviewRequired: true,
        reviewStatus: "approved",
        taskStatus: "submitted",
        userRole: "director",
      }),
      false,
    );
  });

  it("需要复核的任务只有审核通过后才满足案源验收条件", () => {
    assert.equal(isTaskReviewSatisfied({ reviewRequired: false, reviewStatus: "not_required" }), true);
    assert.equal(isTaskReviewSatisfied({ reviewRequired: true, reviewStatus: "pending" }), false);
    assert.equal(isTaskReviewSatisfied({ reviewRequired: true, reviewStatus: "approved" }), true);
  });

  it("校验审核结论并清理意见", () => {
    assert.deepEqual(validateTaskReviewInput({ comment: "  可以进入验收  ", decision: "approved" }), {
      comment: "可以进入验收",
      decision: "approved",
    });
    assert.throws(() => validateTaskReviewInput({ decision: "ignored" }), /审核结论/);
  });
});
