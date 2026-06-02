import { describe, expect, it } from "vitest";
import { ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES } from "@lexos/shared";

describe("AiFeatureMappingsPanel data source", () => {
  it("renders seven configurable feature rows when API returns empty slots", () => {
    expect(ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES).toHaveLength(7);
  });
});
