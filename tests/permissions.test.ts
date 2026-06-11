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

  it("办案律师可以进入任务处理、风控答辩和个人结算相关入口", () => {
    assert.deepEqual(
      getAccessibleMenuItems("handling_lawyer").map((item) => item.key),
      ["dashboard", "market", "my-tasks", "risk", "settlements"],
    );

    assert.equal(canAccessMenu("handling_lawyer", "users"), false);
    assert.equal(canAccessMenu("handling_lawyer", "audit"), false);
    assert.equal(canAccessMenu("handling_lawyer", "funds"), false);
  });

  it("律所管理员可以查看权限矩阵和结算运营入口", () => {
    assert.equal(canAccessMenu("firm_admin", "permissions"), true);
    assert.equal(canAccessMenu("firm_admin", "my-tasks"), true);
    assert.equal(canAccessMenu("firm_admin", "risk"), true);
    assert.equal(canAccessMenu("firm_admin", "settlements"), true);
    assert.equal(canAccessMenu("firm_admin", "funds"), true);
    assert.equal(canAccessMenu("firm_admin", "market"), false);
  });

  it("财务可以进入结算和资金台账，但不能进入人员配置", () => {
    assert.deepEqual(
      getAccessibleMenuItems("finance").map((item) => item.key),
      ["dashboard", "settlements", "funds"],
    );

    assert.equal(canAccessMenu("finance", "users"), false);
    assert.equal(canAccessMenu("finance", "funds"), true);
  });

  it("主任可以进入我的任务处理审核复核", () => {
    assert.equal(canAccessMenu("director", "my-tasks"), true);
    assert.equal(canAccessMenu("director", "risk"), true);
    assert.equal(canAccessMenu("director", "users"), false);
  });

  it("客户和渠道商不进入内部后台菜单", () => {
    assert.equal(getAccessibleMenuItems("customer").length, 0);
    assert.equal(getAccessibleMenuItems("channel_partner").length, 0);
  });

  it("菜单 key 保持唯一，避免导航和矩阵错位", () => {
    const keys = menuPermissionItems.map((item) => item.key);

    assert.equal(new Set(keys).size, keys.length);
  });
});
