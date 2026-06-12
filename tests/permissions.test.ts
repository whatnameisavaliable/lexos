import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canAccessMenu,
  getAccessibleMenuItems,
  getDefaultMenuKey,
  internalUserRoleOptions,
  menuPermissionItems,
} from "../src/lib/permissions/menu.ts";

describe("角色菜单权限", () => {
  it("每个内部角色至少可以进入一个菜单，且默认入口可访问", () => {
    for (const [role] of internalUserRoleOptions) {
      const menus = getAccessibleMenuItems(role);

      assert.ok(menus.length > 0);
      assert.equal(canAccessMenu(role, getDefaultMenuKey(role)), true);
    }
  });

  it("律师不区分案源和承办，都进入个人业务工作台", () => {
    const lawyerMenus = ["dashboard", "customers", "market", "my-tasks", "risk", "settlements"];

    assert.deepEqual(
      getAccessibleMenuItems("lawyer").map((item) => item.key),
      lawyerMenus,
    );
    assert.equal(internalUserRoleOptions.filter(([role]) => role === "lawyer").length, 1);

    assert.equal(canAccessMenu("lawyer", "users"), false);
    assert.equal(canAccessMenu("lawyer", "audit"), false);
    assert.equal(canAccessMenu("lawyer", "funds"), false);
  });

  it("配置管理员只进入系统配置、人员、职级、审计和权限入口", () => {
    assert.deepEqual(
      getAccessibleMenuItems("firm_admin").map((item) => item.key),
      ["users", "ranks", "audit", "settings", "permissions"],
    );

    assert.equal(canAccessMenu("firm_admin", "market"), false);
    assert.equal(canAccessMenu("firm_admin", "my-tasks"), false);
    assert.equal(canAccessMenu("firm_admin", "settlements"), false);
    assert.equal(canAccessMenu("firm_admin", "funds"), false);
  });

  it("主任可以查看全所经营、人员、任务、风控、结算、资金和审计", () => {
    assert.deepEqual(
      getAccessibleMenuItems("director").map((item) => item.key),
      ["dashboard", "users", "ranks", "customers", "market", "my-tasks", "risk", "settlements", "funds", "audit"],
    );

    assert.equal(canAccessMenu("director", "settings"), false);
    assert.equal(canAccessMenu("director", "permissions"), false);
  });

  it("财务可以进入总览、结算和资金台账，但不能进入人员配置", () => {
    assert.deepEqual(
      getAccessibleMenuItems("finance").map((item) => item.key),
      ["dashboard", "settlements", "funds"],
    );

    assert.equal(canAccessMenu("finance", "users"), false);
    assert.equal(canAccessMenu("finance", "funds"), true);
  });

  it("客户和渠道伙伴不进入内部后台菜单", () => {
    assert.equal(getAccessibleMenuItems("customer").length, 0);
    assert.equal(getAccessibleMenuItems("channel_partner").length, 0);
  });

  it("菜单 key 保持唯一，避免导航和矩阵错位", () => {
    const keys = menuPermissionItems.map((item) => item.key);

    assert.equal(new Set(keys).size, keys.length);
  });
});
