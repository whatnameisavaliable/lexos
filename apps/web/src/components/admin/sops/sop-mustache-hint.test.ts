import { describe, expect, it } from "vitest";
import { mustacheHintContainsStepCode } from "./sop-mustache-hint.js";

describe("mustacheHintContainsStepCode", () => {
  it("normalizes step code to artifact prefix", () => {
    expect(mustacheHintContainsStepCode("01-A")).toBe(true);
  });
});
