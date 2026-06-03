import { describe, expect, it } from "vitest";
import {
  isSopFinalizeBlocked,
  SOP_FINALIZE_VERIFY_TOOLTIP,
} from "./sop-finalize-step-button.js";

describe("SopFinalizeStepButton verify gate", () => {
  it("uses verify tooltip when blocked", () => {
    expect(isSopFinalizeBlocked(true, false)).toBe(true);
    expect(SOP_FINALIZE_VERIFY_TOOLTIP).toContain("Verified");
  });
});
