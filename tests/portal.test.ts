import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canCustomerDownloadDeliverable, verifyDemoPortalCode } from "../src/lib/domain/portal.ts";

describe("客户大屏验证码", () => {
  it("demo 阶段使用固定验证码 111111 通过手机号校验", () => {
    assert.equal(
      verifyDemoPortalCode({
        expectedPhone: "13800000000",
        submittedPhone: "13800000000",
        submittedCode: "111111",
        linkStatus: "active",
      }).verified,
      true,
    );
  });

  it("支持使用系统参数覆盖客户大屏验证码", () => {
    assert.equal(
      verifyDemoPortalCode({
        expectedCode: "654321",
        expectedPhone: "13800000000",
        submittedPhone: "13800000000",
        submittedCode: "654321",
        linkStatus: "active",
      }).verified,
      true,
    );

    assert.equal(
      verifyDemoPortalCode({
        expectedCode: "654321",
        expectedPhone: "13800000000",
        submittedPhone: "13800000000",
        submittedCode: "111111",
        linkStatus: "active",
      }).verified,
      false,
    );
  });

  it("手机号、验证码或链接状态不正确时拒绝访问", () => {
    assert.equal(
      verifyDemoPortalCode({
        expectedPhone: "13800000000",
        submittedPhone: "13900000000",
        submittedCode: "111111",
        linkStatus: "active",
      }).verified,
      false,
    );

    assert.equal(
      verifyDemoPortalCode({
        expectedPhone: "13800000000",
        submittedPhone: "13800000000",
        submittedCode: "000000",
        linkStatus: "active",
      }).verified,
      false,
    );

    assert.equal(
      verifyDemoPortalCode({
        expectedPhone: "13800000000",
        submittedPhone: "13800000000",
        submittedCode: "111111",
        linkStatus: "expired",
      }).verified,
      false,
    );
  });
});

describe("客户交付附件访问", () => {
  it("只允许案源验收后的任务向客户开放附件下载", () => {
    assert.equal(canCustomerDownloadDeliverable("submitted"), false);
    assert.equal(canCustomerDownloadDeliverable("approved"), true);
    assert.equal(canCustomerDownloadDeliverable("customer_confirmed"), true);
    assert.equal(canCustomerDownloadDeliverable("settlement_pending"), true);
    assert.equal(canCustomerDownloadDeliverable("settled"), true);
  });
});
