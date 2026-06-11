import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildFundSummary,
  createRiskDeductionFundTransaction,
  fundAccountLabel,
  fundTransactionTypeLabel,
} from "../src/lib/funds/ledger.ts";

describe("资金台账", () => {
  it("锁定扣罚后可以生成风险扣罚入账流水", () => {
    const transaction = createRiskDeductionFundTransaction({
      id: "f-001",
      amountCents: 378_000,
      createdAt: "2026-06-09T10:00:00.000Z",
      createdByName: "财务负责人",
      destination: "risk_reserve",
      lawyerName: "赵高级律师",
      note: "委员会扣减裁决",
      riskCaseId: "r-004",
      riskCaseTitle: "扣减裁决",
      settlementId: "s-001",
      taskId: "t-005",
      taskTitle: "数据合规专项法律意见",
    });

    assert.equal(transaction.accountType, "risk_reserve");
    assert.equal(transaction.amountCents, 378_000);
    assert.equal(transaction.direction, "inflow");
    assert.equal(transaction.transactionType, "risk_deduction");
    assert.equal(fundAccountLabel(transaction.accountType), "公共风险储备金");
    assert.equal(fundTransactionTypeLabel(transaction.transactionType), "扣罚入账");
  });

  it("按账户汇总已入账流水并忽略作废流水", () => {
    const summary = buildFundSummary([
      createRiskDeductionFundTransaction({
        id: "f-001",
        amountCents: 378_000,
        createdAt: "2026-06-09T10:00:00.000Z",
        destination: "risk_reserve",
        settlementId: "s-001",
      }),
      {
        id: "f-002",
        accountType: "quality_fund",
        amountCents: 120_000,
        createdAt: "2026-06-09T11:00:00.000Z",
        direction: "inflow",
        status: "posted",
        transactionType: "risk_deduction",
      },
      {
        id: "f-003",
        accountType: "quality_fund",
        amountCents: 20_000,
        createdAt: "2026-06-09T12:00:00.000Z",
        direction: "outflow",
        status: "void",
        transactionType: "manual_adjustment",
      },
    ]);
    const riskReserve = summary.find((item) => item.accountType === "risk_reserve");
    const qualityFund = summary.find((item) => item.accountType === "quality_fund");
    const clientRefund = summary.find((item) => item.accountType === "client_refund");

    assert.equal(summary.length, 4);
    assert.equal(riskReserve?.balanceCents, 378_000);
    assert.equal(riskReserve?.postedCount, 1);
    assert.equal(qualityFund?.balanceCents, 120_000);
    assert.equal(qualityFund?.postedCount, 1);
    assert.equal(clientRefund?.balanceCents, 0);
  });
});
