import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCustomerAutoConfirmStatus,
  customerAutoConfirmDueAt,
  isCustomerAutoConfirmDue,
} from "../src/lib/tasks/customer-auto-confirm.ts";

describe("客户逾期自动确认规则", () => {
  it("按验收时间和配置天数计算到期时间", () => {
    const dueAt = customerAutoConfirmDueAt("2026-06-01T00:00:00.000Z", 7);

    assert.equal(dueAt?.toISOString(), "2026-06-08T00:00:00.000Z");
  });

  it("客户待确认任务超过配置天数后可视为交付", () => {
    assert.equal(
      isCustomerAutoConfirmDue(
        {
          approvedAt: "2026-06-01T00:00:00.000Z",
          assignedLawyerId: "u-lawyer",
          status: "approved",
        },
        7,
        new Date("2026-06-08T00:00:00.000Z"),
      ),
      true,
    );
  });

  it("未超过配置天数时保持待客户确认", () => {
    const status = buildCustomerAutoConfirmStatus(
      {
        approvedAt: "2026-06-01T00:00:00.000Z",
        assignedLawyerId: "u-lawyer",
        status: "approved",
      },
      7,
      new Date("2026-06-07T23:59:59.000Z"),
    );

    assert.equal(status.due, false);
    assert.equal(status.reason, "not_due");
  });

  it("配置为 0 时停用逾期自动确认", () => {
    const status = buildCustomerAutoConfirmStatus(
      {
        approvedAt: "2026-06-01T00:00:00.000Z",
        assignedLawyerId: "u-lawyer",
        status: "approved",
      },
      0,
      new Date("2026-06-30T00:00:00.000Z"),
    );

    assert.equal(status.due, false);
    assert.equal(status.reason, "disabled");
  });

  it("非待确认、已确认或缺少承办律师的任务不进入处理范围", () => {
    assert.equal(
      isCustomerAutoConfirmDue(
        {
          approvedAt: "2026-06-01T00:00:00.000Z",
          assignedLawyerId: "u-lawyer",
          status: "settlement_pending",
        },
        7,
        new Date("2026-06-30T00:00:00.000Z"),
      ),
      false,
    );
    assert.equal(
      isCustomerAutoConfirmDue(
        {
          approvedAt: "2026-06-01T00:00:00.000Z",
          assignedLawyerId: "u-lawyer",
          customerConfirmedAt: "2026-06-02T00:00:00.000Z",
          status: "approved",
        },
        7,
        new Date("2026-06-30T00:00:00.000Z"),
      ),
      false,
    );
    assert.equal(
      isCustomerAutoConfirmDue(
        {
          approvedAt: "2026-06-01T00:00:00.000Z",
          status: "approved",
        },
        7,
        new Date("2026-06-30T00:00:00.000Z"),
      ),
      false,
    );
  });
});
