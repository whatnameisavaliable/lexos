import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildSystemSettingsFromRows,
  normalizeSystemSettingValue,
} from "../src/lib/settings/definitions.ts";
import {
  buildRiskDeductionRatesFromSettings,
  calculateRiskDeductionPreview,
} from "../src/lib/risk/deductions.ts";
import {
  buildSettlementRiskLockStatus,
  isSettlementConfirmationLocked,
  settlementLockUntil,
} from "../src/lib/settings/runtime.ts";

describe("系统参数定义", () => {
  it("用数据库值覆盖默认参数", () => {
    const settings = buildSystemSettingsFromRows([
      {
        key: "settlement_lock_days",
        updated_at: "2026-06-07T10:00:00.000Z",
        value: 45,
      },
    ]);
    const lockDays = settings.find((setting) => setting.key === "settlement_lock_days");
    const autoConfirmDays = settings.find((setting) => setting.key === "customer_auto_confirm_days");
    const pageSize = settings.find((setting) => setting.key === "default_page_size");
    const mediumDeduction = settings.find((setting) => setting.key === "risk_deduction_medium_basis_points");

    assert.equal(lockDays?.value, 45);
    assert.equal(lockDays?.updatedAt, "2026-06-07T10:00:00.000Z");
    assert.equal(autoConfirmDays?.value, 7);
    assert.equal(pageSize?.value, 50);
    assert.equal(mediumDeduction?.value, 500);
  });

  it("校验数字参数范围", () => {
    assert.equal(normalizeSystemSettingValue("default_page_size", 80), 80);
    assert.throws(() => normalizeSystemSettingValue("default_page_size", 500), /不能大于 100/);
    assert.equal(normalizeSystemSettingValue("risk_deduction_high_basis_points", 2500), 2500);
    assert.throws(() => normalizeSystemSettingValue("risk_deduction_high_basis_points", 10001), /不能大于 10000/);
  });

  it("校验未知参数", () => {
    assert.throws(() => normalizeSystemSettingValue("unknown", true), /未知系统参数/);
  });

  it("计算显式结算锁定期", () => {
    const generatedAt = "2026-06-01T00:00:00.000Z";
    const lockedUntil = settlementLockUntil(generatedAt, 7);

    assert.equal(lockedUntil?.toISOString(), "2026-06-08T00:00:00.000Z");
    assert.equal(isSettlementConfirmationLocked(generatedAt, 7, new Date("2026-06-07T23:59:59.000Z")), true);
    assert.equal(isSettlementConfirmationLocked(generatedAt, 7, new Date("2026-06-08T00:00:00.000Z")), false);
    assert.equal(isSettlementConfirmationLocked(generatedAt, 0, new Date("2026-06-02T00:00:00.000Z")), false);
  });

  it("计算 30 天风控锁定期剩余天数", () => {
    const lockStatus = buildSettlementRiskLockStatus(
      "2026-06-01T00:00:00.000Z",
      30,
      new Date("2026-06-10T12:00:00.000Z"),
    );

    assert.equal(lockStatus.locked, true);
    assert.equal(lockStatus.daysRemaining, 21);
    assert.equal(lockStatus.lockedUntil?.toISOString(), "2026-07-01T00:00:00.000Z");
  });

  it("按风控级别系统参数计算建议扣减金额", () => {
    const rates = buildRiskDeductionRatesFromSettings([
      {
        key: "risk_deduction_high_basis_points",
        value: 2000,
      },
    ]);
    const preview = calculateRiskDeductionPreview(1_000_000, "high", rates);
    const lowPreview = calculateRiskDeductionPreview(1_000_000, "low", rates);

    assert.equal(preview?.basisPoints, 2000);
    assert.equal(preview?.deductionAmountCents, 200_000);
    assert.equal(preview?.payableAmountCents, 800_000);
    assert.equal(preview?.enabled, true);
    assert.equal(lowPreview?.deductionAmountCents, 0);
    assert.equal(lowPreview?.enabled, false);
  });
});
