import { describe, expect, it } from "vitest";
import { detectDependsOnCycle } from "./detect-depends-on-cycle.js";

describe("detectDependsOnCycle", () => {
  it("detects a three-node cycle", () => {
    const cycle = detectDependsOnCycle([
      { stepCode: "A", dependsOn: ["C"] },
      { stepCode: "B", dependsOn: ["A"] },
      { stepCode: "C", dependsOn: ["B"] },
    ]);
    expect(cycle).not.toBeNull();
  });

  it("returns null for acyclic graph", () => {
    const cycle = detectDependsOnCycle([
      { stepCode: "A", dependsOn: [] },
      { stepCode: "B", dependsOn: ["A"] },
    ]);
    expect(cycle).toBeNull();
  });
});
