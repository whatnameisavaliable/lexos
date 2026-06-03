import { describe, expect, it } from "vitest";
import { coerceSopFormValues } from "@/lib/coerce-sop-form-values";

describe("SopJsonSchemaForm", () => {
  it("coerce returns empty when required fields missing in formData", () => {
    expect(coerceSopFormValues(undefined)).toEqual({});
  });
});
