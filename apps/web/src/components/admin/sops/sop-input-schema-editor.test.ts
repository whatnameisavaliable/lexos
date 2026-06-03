import { describe, expect, it } from "vitest";
import { validateJsonSchemaText } from "@/lib/validate-json-schema-text.js";

describe("SopInputSchemaEditor", () => {
  it("validates schema text before save", () => {
    expect(validateJsonSchemaText('{"type":"object"}').ok).toBe(true);
  });
});
