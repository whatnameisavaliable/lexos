import { describe, expect, it } from "vitest";
import { estimateTokenCount } from "./estimate-token-count.js";

describe("estimateTokenCount", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokenCount("")).toBe(0);
  });

  it("increases monotonically with text length", () => {
    const short = estimateTokenCount("abc");
    const long = estimateTokenCount("a".repeat(400));
    expect(long).toBeGreaterThan(short);
  });
});
