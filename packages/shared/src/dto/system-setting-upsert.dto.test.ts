import { describe, expect, it } from "vitest";
import { parseSystemSettingUpsert } from "./system-setting-upsert.dto.js";

describe("parseSystemSettingUpsert", () => {
  it("parses JSON object value", () => {
    const result = parseSystemSettingUpsert({
      value: { retentionDays: 365, notifyEmail: "ops@example.com" },
    });
    expect(result.value).toEqual({
      retentionDays: 365,
      notifyEmail: "ops@example.com",
    });
  });

  it("rejects non-object value", () => {
    expect(() => parseSystemSettingUpsert({ value: "string" })).toThrow();
  });
});
