import { describe, expect, it } from "vitest";
import { LexosError } from "@lexos/shared";
import { assertDependsOnReferencesExist } from "./assert-step-codes-resolved.js";

describe("assertDependsOnReferencesExist", () => {
  it("throws for unknown dependency", () => {
    expect(() =>
      assertDependsOnReferencesExist([
        { stepCode: "A", dependsOn: ["MISSING"] },
      ]),
    ).toThrow(LexosError);
  });

  it("passes when all references exist", () => {
    expect(() =>
      assertDependsOnReferencesExist([
        { stepCode: "A", dependsOn: [] },
        { stepCode: "B", dependsOn: ["A"] },
      ]),
    ).not.toThrow();
  });
});
