import { describe, expect, it } from "vitest";
import { isSopFinalizeBlocked } from "./sop-finalize-step-button.js";

describe("isSopFinalizeBlocked", () => {
  it("blocks when verification required and not verified", () => {
    expect(isSopFinalizeBlocked(true, false)).toBe(true);
  });

  it("allows when verified", () => {
    expect(isSopFinalizeBlocked(true, true)).toBe(false);
  });
});
