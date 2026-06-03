import { describe, expect, it } from "vitest";
import { navItemsForRole } from "./menus.js";

describe("menus SOP nav", () => {
  it("shows SOP templates item for admin", () => {
    const items = navItemsForRole("admin");
    expect(items.some((item) => item.href === "/admin/sops")).toBe(true);
  });

  it("hides SOP templates item for lawyer", () => {
    const items = navItemsForRole("lawyer");
    expect(items.some((item) => item.href === "/admin/sops")).toBe(false);
  });
});
