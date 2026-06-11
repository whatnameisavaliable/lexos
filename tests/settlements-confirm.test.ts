import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "../src/lib/api/errors.ts";
import { MAX_BULK_SETTLEMENT_CONFIRMATIONS, normalizeSettlementIdList } from "../src/lib/settlements/confirm.ts";

describe("结算批量确认", () => {
  it("清理并去重批量确认 ID", () => {
    assert.deepEqual(normalizeSettlementIdList([" s-1 ", "s-2", "s-1", "", 123]), ["s-1", "s-2"]);
  });

  it("拒绝空 ID 列表", () => {
    assert.throws(() => normalizeSettlementIdList([]), ApiError);
    assert.throws(() => normalizeSettlementIdList("s-1"), ApiError);
  });

  it("限制单次批量确认数量", () => {
    const ids = Array.from({ length: MAX_BULK_SETTLEMENT_CONFIRMATIONS + 1 }, (_, index) => `s-${index}`);

    assert.throws(() => normalizeSettlementIdList(ids), ApiError);
  });
});
