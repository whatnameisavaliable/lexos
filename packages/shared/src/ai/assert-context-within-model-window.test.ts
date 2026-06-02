import { describe, expect, it } from "vitest";
import { ErrorCode } from "../api/error-code.js";
import { LexosError } from "../errors/lexos-error.js";
import { assertContextWithinModelWindow } from "./assert-context-within-model-window.js";

describe("assertContextWithinModelWindow", () => {
  it("throws CONTEXT_LIMIT_EXCEEDED when over window", () => {
    expect(() => assertContextWithinModelWindow(100, 50)).toThrow(LexosError);
    try {
      assertContextWithinModelWindow(100, 50);
    } catch (err) {
      expect((err as LexosError).code).toBe(ErrorCode.CONTEXT_LIMIT_EXCEEDED);
    }
  });

  it("does not throw when equal to window", () => {
    expect(() => assertContextWithinModelWindow(50, 50)).not.toThrow();
  });
});
