import { describe, expect, it } from "vitest";
import { assertSystemSettingKeyAllowed } from "./system-setting-key-guard.js";

describe("assertSystemSettingKeyAllowed", () => {
  it("allows benign keys", () => {
    expect(() => assertSystemSettingKeyAllowed("retention.days")).not.toThrow();
  });

  it("rejects secret-like keys", () => {
    expect(() => assertSystemSettingKeyAllowed("smtp.api_key")).toThrow(
      "SYSTEM_SETTING_KEY_FORBIDDEN",
    );
  });
});
