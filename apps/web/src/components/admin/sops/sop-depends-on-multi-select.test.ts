import { describe, expect, it } from "vitest";
import { filterDependsOnOptions } from "./sop-depends-on-multi-select.js";

describe("filterDependsOnOptions", () => {
  it("excludes self step code", () => {
    expect(filterDependsOnOptions(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });
});
