import { describe, expect, it } from "vitest";
import { shouldShowAiFields } from "./sop-admin-ui-utils.js";
import { SopExecutionType } from "@lexos/shared";

describe("SopStepEditorForm", () => {
  it("hides AI fields for manual execution", () => {
    expect(shouldShowAiFields(SopExecutionType.MANUAL)).toBe(false);
  });
});
