import { describe, expect, it } from "vitest";
import { ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES } from "./admin-configurable-feature-keys.js";

describe("ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES", () => {
  it("has length 7 and includes sop.deep_research", () => {
    expect(ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES).toHaveLength(7);
    expect(ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES).toContain("sop.deep_research");
  });
});
