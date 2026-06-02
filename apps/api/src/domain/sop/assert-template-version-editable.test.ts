import { describe, expect, it } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import { assertTemplateVersionEditable } from "./assert-template-version-editable.js";

describe("assertTemplateVersionEditable", () => {
  it("does not throw for draft versions", () => {
    expect(() => assertTemplateVersionEditable(false)).not.toThrow();
  });

  it("throws OPERATION_NOT_ALLOWED for published versions", () => {
    expect(() => assertTemplateVersionEditable(true)).toThrow(LexosError);
    try {
      assertTemplateVersionEditable(true);
    } catch (err) {
      expect((err as LexosError).code).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
    }
  });
});
