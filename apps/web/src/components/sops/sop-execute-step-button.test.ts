import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import { isDeepResearchExecuteDisabled } from "./sop-execute-step-button.js";

describe("SopExecuteStepButton", () => {
  it("does not disable sync_llm when deep research off", () => {
    expect(
      isDeepResearchExecuteDisabled(SopExecutionType.SYNC_LLM, false),
    ).toBe(false);
  });
});
