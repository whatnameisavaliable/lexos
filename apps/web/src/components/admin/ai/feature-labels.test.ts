import { describe, expect, it } from "vitest";
import { SOP_AI_FEATURE_KEY_VALUES } from "@lexos/shared";
import { AI_FEATURE_LABELS } from "./feature-labels.js";

describe("AI_FEATURE_LABELS", () => {
  it("has non-empty labels for all SOP feature keys", () => {
    for (const key of SOP_AI_FEATURE_KEY_VALUES) {
      expect(AI_FEATURE_LABELS[key]?.length).toBeGreaterThan(0);
    }
  });
});
