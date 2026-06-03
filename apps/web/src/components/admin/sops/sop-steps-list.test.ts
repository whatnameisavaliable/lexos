import { describe, expect, it } from "vitest";
import { filterDependsOnOptions } from "./sop-depends-on-multi-select.js";

describe("SopStepsList", () => {
  it("depends_on options exclude current step", () => {
    expect(filterDependsOnOptions(["a", "b"], "a")).toEqual(["b"]);
  });
});
