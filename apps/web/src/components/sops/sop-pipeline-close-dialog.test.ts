import { describe, expect, it } from "vitest";
import { shouldShowSopCloseButton } from "./sop-pipeline-close-dialog.js";

describe("shouldShowSopCloseButton", () => {
  it("hides close button when completed", () => {
    expect(shouldShowSopCloseButton("completed")).toBe(false);
  });

  it("shows close button when in_progress", () => {
    expect(shouldShowSopCloseButton("in_progress")).toBe(true);
  });
});
