import { describe, expect, it } from "vitest";
import { navItemsForRole } from "./menus.js";

describe("menus lawyer SOP", () => {
  it("shows SOP pipeline item for lawyer", () => {
    const items = navItemsForRole("lawyer");
    expect(items.some((item) => item.href === "/sops")).toBe(true);
  });

  it("hides lawyer SOP item for admin", () => {
    const items = navItemsForRole("admin");
    expect(items.some((item) => item.href === "/sops")).toBe(false);
  });
});
