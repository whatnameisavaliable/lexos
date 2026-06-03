import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import { shouldShowDeepResearchOfflineBanner } from "./sop-step-action-panel.js";

describe("shouldShowDeepResearchOfflineBanner", () => {
  it("shows when deep research disabled", () => {
    expect(
      shouldShowDeepResearchOfflineBanner(
        SopExecutionType.ASYNC_DEEP_RESEARCH,
        false,
      ),
    ).toBe(true);
  });
});
