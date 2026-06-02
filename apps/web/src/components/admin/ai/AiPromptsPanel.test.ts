import { describe, expect, it } from "vitest";
import { AI_FEATURE_LABELS } from "./feature-labels.js";

describe("AiPromptsPanel labels", () => {
  it("renders sop.visual_charting label without undefined", () => {
    expect(AI_FEATURE_LABELS["sop.visual_charting"]).toBe("SOP 可视化图表");
  });
});
