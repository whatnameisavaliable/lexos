import { describe, expect, it } from "vitest";
import {
  computeErrorRate,
  isSmokePassed,
} from "../../scripts/load/smoke-lib.mjs";

describe("smoke-lib", () => {
  it("computeErrorRate returns ratio of failures", () => {
    expect(computeErrorRate(0, 100)).toBe(0);
    expect(computeErrorRate(1, 100)).toBe(0.01);
    expect(computeErrorRate(1, 0)).toBe(1);
  });

  it("isSmokePassed enforces error rate below 1%", () => {
    expect(isSmokePassed(0)).toBe(true);
    expect(isSmokePassed(0.009)).toBe(true);
    expect(isSmokePassed(0.01)).toBe(false);
    expect(isSmokePassed(0.05)).toBe(false);
  });
});
