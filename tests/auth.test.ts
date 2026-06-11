import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAuthEmailForUsername,
  normalizeUsername,
  validateCreateUserInput,
  validateUpdateUserInput,
} from "../src/lib/auth/user-provisioning.ts";
import { DEFAULT_INITIAL_PASSWORD } from "../src/lib/domain/core.ts";

describe("用户名登录映射", () => {
  it("规范化用户名并生成内部认证邮箱", () => {
    assert.equal(normalizeUsername("  Admin_01  "), "admin_01");
    assert.equal(buildAuthEmailForUsername(" Admin_01 ", "lexos.local"), "admin_01@lexos.local");
  });

  it("拒绝不适合作为内部账号的用户名", () => {
    assert.throws(() => normalizeUsername("admin-01"), /用户名只能包含/);
    assert.throws(() => normalizeUsername("ab"), /用户名长度/);
  });
});

describe("更新用户输入", () => {
  it("非律师会清空职级", () => {
    const input = validateUpdateUserInput({
      rankId: "rank-l2a",
      roleCode: "finance",
      status: "active",
    });

    assert.equal(input.rankId, undefined);
  });

  it("更新为任一律师角色时必须绑定职级", () => {
    assert.throws(
      () =>
        validateUpdateUserInput({
          roleCode: "handling_lawyer",
          status: "active",
        }),
      /律师必须绑定职级/,
    );
    assert.throws(
      () =>
        validateUpdateUserInput({
          roleCode: "source_lawyer",
          status: "active",
        }),
      /律师必须绑定职级/,
    );
  });

  it("拒绝非法用户状态", () => {
    assert.throws(
      () =>
        validateUpdateUserInput({
          roleCode: "finance",
          status: "locked" as "active",
        }),
      /用户状态不正确/,
    );
  });
});

describe("创建用户输入", () => {
  it("为新用户固定默认密码并要求首次改密", () => {
    const input = validateCreateUserInput({
      username: "lawyer02",
      displayName: "李律师",
      roleCode: "handling_lawyer",
      rankId: "rank-l2a",
      phone: "13800000000",
    });

    assert.equal(input.defaultPassword, DEFAULT_INITIAL_PASSWORD);
    assert.equal(input.mustChangePassword, true);
    assert.equal(input.authEmail, "lawyer02@lexos.local");
  });

  it("律师必须绑定职级", () => {
    assert.throws(
      () =>
        validateCreateUserInput({
          username: "lawyer03",
          displayName: "赵律师",
          roleCode: "handling_lawyer",
        }),
      /律师必须绑定职级/,
    );
  });
});
