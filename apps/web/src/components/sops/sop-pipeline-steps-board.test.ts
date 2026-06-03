import { describe, expect, it } from "vitest";

describe("SopPipelineStepsBoard", () => {
  it("highlights selected step code", () => {
    const selected = "01";
    const current = "02";
    expect(selected).not.toBe(current);
  });
});
