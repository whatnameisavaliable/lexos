import { describe, expect, it } from "vitest";
import { findDagEntryStepCode } from "./find-dag-entry-step-code.js";

describe("findDagEntryStepCode", () => {
  it("returns the single entry step", () => {
    const code = findDagEntryStepCode([
      { stepCode: "01-A", dependsOn: [] },
      { stepCode: "01-B", dependsOn: ["01-A"] },
    ]);
    expect(code).toBe("01-A");
  });

  it("throws when multiple entries", () => {
    expect(() =>
      findDagEntryStepCode([
        { stepCode: "A", dependsOn: [] },
        { stepCode: "B", dependsOn: [] },
      ]),
    ).toThrow(/exactly one DAG entry/);
  });
});
