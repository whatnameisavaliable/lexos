import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import { shouldShowAiFields } from "./sop-admin-ui-utils.js";

describe("shouldShowAiFields", () => {
  it("hides AI fields for manual steps", () => {
    expect(shouldShowAiFields(SopExecutionType.MANUAL)).toBe(false);
  });

  it("shows AI fields for sync_llm", () => {
    expect(shouldShowAiFields(SopExecutionType.SYNC_LLM)).toBe(true);
  });
});
