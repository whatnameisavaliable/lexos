import { describe, expect, it } from "vitest";
import { ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES } from "@lexos/shared";
import { AI_FEATURE_LABELS } from "./feature-labels.js";

describe("AiPromptEditorDialog SOP options", () => {
  it("includes sop.deep_research in selectable feature keys", () => {
    expect(ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES).toContain("sop.deep_research");
    expect(AI_FEATURE_LABELS["sop.deep_research"]).toBeTruthy();
  });
});
