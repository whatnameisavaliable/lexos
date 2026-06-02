import { describe, expect, it } from "vitest";
import { LexosError } from "../errors/lexos-error.js";
import { assertMustacheSlotsCoveredByDependsOn } from "./validate-mustache-slots-in-depends-on.js";

describe("assertMustacheSlotsCoveredByDependsOn", () => {
  it("throws when slot step is not in depends_on", () => {
    expect(() =>
      assertMustacheSlotsCoveredByDependsOn(
        ["artifact_99_Z_fact"],
        ["01-A"],
      ),
    ).toThrow(LexosError);
  });

  it("passes when prefix matches depends_on step", () => {
    expect(() =>
      assertMustacheSlotsCoveredByDependsOn(
        ["artifact_01_A_fact"],
        ["01-A"],
      ),
    ).not.toThrow();
  });
});
