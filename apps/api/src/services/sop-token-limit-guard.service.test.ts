import { describe, expect, it } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { assertSopPromptWithinModelWindow } from "./sop-token-limit-guard.service.js";

describe("assertSopPromptWithinModelWindow", () => {
  it("throws CONTEXT_LIMIT_EXCEEDED when over window", () => {
    const huge = "x".repeat(10_000);
    expect(() =>
      assertSopPromptWithinModelWindow(huge, huge, 10),
    ).toThrow(AppHttpError);
    try {
      assertSopPromptWithinModelWindow(huge, huge, 10);
    } catch (err) {
      expect((err as AppHttpError).code).toBe(ErrorCode.CONTEXT_LIMIT_EXCEEDED);
    }
  });
});
