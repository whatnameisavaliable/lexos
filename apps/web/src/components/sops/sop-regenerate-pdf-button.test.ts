import { describe, expect, it } from "vitest";
import { shouldShowRegeneratePdfButton } from "./sop-regenerate-pdf-button.js";

describe("shouldShowRegeneratePdfButton", () => {
  it("shows only for finalized", () => {
    expect(shouldShowRegeneratePdfButton("finalized")).toBe(true);
    expect(shouldShowRegeneratePdfButton("draft")).toBe(false);
  });
});
