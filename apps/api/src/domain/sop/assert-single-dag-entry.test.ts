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

  it("passes for a single entry", () => {
    expect(() =>
      assertSingleDagEntry([
        { stepCode: "A", dependsOn: [] },
        { stepCode: "B", dependsOn: ["A"] },
      ]),
    ).not.toThrow();
  });
});
