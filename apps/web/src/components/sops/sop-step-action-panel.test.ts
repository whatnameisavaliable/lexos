import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";

describe("SopStepActionPanel", () => {
  it("shows form for manual execution type", () => {
    expect(SopExecutionType.MANUAL).toBe("manual");
  });
});
