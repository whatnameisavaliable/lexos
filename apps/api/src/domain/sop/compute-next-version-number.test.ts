import { describe, expect, it } from "vitest";
import { computeNextVersionNumber } from "./compute-next-version-number.js";

describe("computeNextVersionNumber", () => {
  it("returns 1 when no published versions exist", () => {
    expect(computeNextVersionNumber(0)).toBe(1);
  });

  it("increments from existing max", () => {
    expect(computeNextVersionNumber(3)).toBe(4);
  });
});
