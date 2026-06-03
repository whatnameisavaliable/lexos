import { describe, expect, it } from "vitest";
import { shouldToastLoadError } from "./sop-admin-ui-utils.js";

describe("AdminSopVersionEditorShell load", () => {
  it("toasts when error message present", () => {
    expect(shouldToastLoadError("加载失败")).toBe(true);
  });

  it("does not toast when no error", () => {
    expect(shouldToastLoadError(null)).toBe(false);
  });
});
