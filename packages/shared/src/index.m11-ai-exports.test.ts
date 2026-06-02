import { describe, expect, it } from "vitest";
import { ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES } from "./index.js";

describe("M11 shared package exports", () => {
  it("re-exports ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES", () => {
    expect(ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES).toHaveLength(7);
  });
});
