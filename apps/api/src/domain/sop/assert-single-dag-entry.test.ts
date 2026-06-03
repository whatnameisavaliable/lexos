import { describe, expect, it } from "vitest";
import { LexosError } from "@lexos/shared";
import { assertSingleDagEntry } from "./assert-single-dag-entry.js";

describe("assertSingleDagEntry", () => {
  it("throws when two entry nodes exist", () => {
    expect(() =>
      assertSingleDagEntry([
        { stepCode: "A", dependsOn: [] },
        { stepCode: "B", dependsOn: [] },
      ]),
    ).toThrow(LexosError);
  });

  it("passes for a single entry (empty depends_on)", () => {
    expect(() =>
      assertSingleDagEntry([
        { stepCode: "A", dependsOn: [] },
        { stepCode: "B", dependsOn: ["A"] },
      ]),
    ).not.toThrow();
  });

  it("rejects linear chain when only first step has empty depends_on missing", () => {
    expect(() =>
      assertSingleDagEntry([
        { stepCode: "B", dependsOn: ["A"] },
        { stepCode: "A", dependsOn: [] },
      ]),
    ).not.toThrow();
  });
});
