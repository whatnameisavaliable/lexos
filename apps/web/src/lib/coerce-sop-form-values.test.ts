import { describe, expect, it } from "vitest";
import { coerceSopFormValues } from "./coerce-sop-form-values.js";

describe("coerceSopFormValues", () => {
  it("returns empty object for invalid input", () => {
    expect(coerceSopFormValues(undefined)).toEqual({});
    expect(coerceSopFormValues([] as unknown as Record<string, unknown>)).toEqual(
      {},
    );
  });

  it("copies form data record", () => {
    expect(coerceSopFormValues({ a: 1 })).toEqual({ a: 1 });
  });
});
