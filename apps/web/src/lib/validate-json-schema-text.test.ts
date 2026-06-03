import { describe, expect, it } from "vitest";
import { validateJsonSchemaText } from "./validate-json-schema-text.js";

describe("validateJsonSchemaText", () => {
  it("returns error for invalid JSON", () => {
    const result = validateJsonSchemaText("{ invalid");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("JSON 格式无效");
  });

  it("accepts empty object schema", () => {
    expect(validateJsonSchemaText('{"type":"object"}').ok).toBe(true);
  });

  it("rejects array root", () => {
    expect(validateJsonSchemaText("[]").ok).toBe(false);
  });
});
