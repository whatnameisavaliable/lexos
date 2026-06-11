import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canClaimTask,
  calculateSettlementAmount,
  createInitialUserProfile,
  transitionTaskStatus,
} from "../src/lib/domain/core.ts";

describe("结算金额", () => {
  it("按任务金额和职级比例计算律师待结算金额", () => {
    assert.equal(calculateSettlementAmount(1_000_000, 6500), 650_000);
  });

  it("遇到不能整除的分时向下取整，避免超额结算", () => {
    assert.equal(calculateSettlementAmount(999, 6500), 649);
  });
});

describe("默认用户", () => {
  it("管理员和新用户默认必须在首次登录后修改密码", () => {
    const profile = createInitialUserProfile("admin", "系统管理员");

    assert.equal(profile.username, "admin");
    assert.equal(profile.defaultPassword, "111111");
    assert.equal(profile.mustChangePassword, true);
  });
});

describe("任务抢单", () => {
  it("办案律师职级满足最低要求且任务开放时可以抢单", () => {
    assert.equal(
      canClaimTask({
        taskStatus: "open",
        userRole: "handling_lawyer",
        lawyerRankOrder: 6,
        minRankOrder: 4,
      }),
      true,
    );
  });

  it("任务已被抢或职级不足时不能抢单", () => {
    assert.equal(
      canClaimTask({
        taskStatus: "claimed",
        userRole: "handling_lawyer",
        lawyerRankOrder: 9,
        minRankOrder: 1,
      }),
      false,
    );

    assert.equal(
      canClaimTask({
        taskStatus: "open",
        userRole: "handling_lawyer",
        lawyerRankOrder: 2,
        minRankOrder: 5,
      }),
      false,
    );
  });
});

describe("任务状态流转", () => {
  it("允许按 MVP 闭环顺序推进任务", () => {
    assert.equal(transitionTaskStatus("open", "claim"), "claimed");
    assert.equal(transitionTaskStatus("claimed", "submit"), "submitted");
    assert.equal(transitionTaskStatus("submitted", "approve"), "approved");
    assert.equal(transitionTaskStatus("approved", "customer_confirm"), "customer_confirmed");
    assert.equal(transitionTaskStatus("customer_confirmed", "generate_settlement"), "settlement_pending");
    assert.equal(transitionTaskStatus("settlement_pending", "settle"), "settled");
  });

  it("拒绝跳过验收直接结算", () => {
    assert.throws(
      () => transitionTaskStatus("submitted", "generate_settlement"),
      /非法任务状态流转/,
    );
  });
});

