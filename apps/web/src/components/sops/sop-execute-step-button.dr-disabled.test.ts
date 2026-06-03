import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import {
  isDeepResearchExecuteDisabled,
  SOP_DEEP_RESEARCH_DISABLED_TOOLTIP,
} from "./sop-execute-step-button.js";

describe("SopExecuteStepButton deep research disabled", () => {
  it("disables async_deep_research when flag false", () => {
    expect(
      isDeepResearchExecuteDisabled(
        SopExecutionType.ASYNC_DEEP_RESEARCH,
        false,
      ),
    ).toBe(true);
  });

  it("has readable tooltip", () => {
    expect(SOP_DEEP_RESEARCH_DISABLED_TOOLTIP.length).toBeGreaterThan(5);
  });
});
