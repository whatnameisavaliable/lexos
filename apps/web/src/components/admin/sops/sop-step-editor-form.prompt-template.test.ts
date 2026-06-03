import { describe, expect, it } from "vitest";
import { shouldShowAiFields } from "./sop-admin-ui-utils.js";
import { SopExecutionType } from "@lexos/shared";

describe("SopStepEditorForm prompt template", () => {
  it("shows prompt fields for sync_llm", () => {
    expect(shouldShowAiFields(SopExecutionType.SYNC_LLM)).toBe(true);
  });
});
