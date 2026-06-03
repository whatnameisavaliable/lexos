import { describe, expect, it } from "vitest";
import { isSaveStepsDisabled } from "./sop-version-editor-toolbar.js";

describe("isSaveStepsDisabled", () => {
  it("disables save when published", () => {
    expect(isSaveStepsDisabled(true, false)).toBe(true);
  });

  it("allows save on draft when not saving", () => {
    expect(isSaveStepsDisabled(false, false)).toBe(false);
  });
});
