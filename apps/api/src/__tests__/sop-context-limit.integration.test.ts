import { describe, expect, it } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { assertSopPromptWithinModelWindow } from "../services/sop-token-limit-guard.service.js";

describe("sop context limit (integration mock)", () => {
  it("throws CONTEXT_LIMIT_EXCEEDED when assembled prompt exceeds model window", () => {
    const hugePrompt = "word ".repeat(500_000);
    expect(() =>
      assertSopPromptWithinModelWindow(hugePrompt, "system", 4096),
    ).toThrow(AppHttpError);

    try {
      assertSopPromptWithinModelWindow(hugePrompt, "system", 4096);
    } catch (err) {
      expect(err).toBeInstanceOf(AppHttpError);
      expect((err as AppHttpError).code).toBe(ErrorCode.CONTEXT_LIMIT_EXCEEDED);
    }
  });
});
