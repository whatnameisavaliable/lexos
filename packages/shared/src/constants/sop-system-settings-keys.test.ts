import { describe, expect, it } from "vitest";
import {
  SOP_DEEP_RESEARCH_ENABLED_KEY,
  SOP_SYSTEM_SETTINGS_KEYS,
} from "./sop-system-settings-keys.js";

describe("sop-system-settings-keys", () => {
  it("defines deep research toggle key", () => {
    expect(SOP_DEEP_RESEARCH_ENABLED_KEY).toBe("sop.deep_research_enabled");
    expect(SOP_SYSTEM_SETTINGS_KEYS).toContain(SOP_DEEP_RESEARCH_ENABLED_KEY);
  });
});
