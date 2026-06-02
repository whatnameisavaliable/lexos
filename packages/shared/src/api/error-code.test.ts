import { describe, expect, it } from "vitest";
import {
  ERROR_CODE_HTTP_STATUS,
  ErrorCode,
  isErrorCode,
} from "./error-code.js";

describe("ErrorCode", () => {
  it("includes all architecture.md §6.2 codes", () => {
    expect(ErrorCode.AUTH_UNAUTHORIZED).toBe("AUTH_UNAUTHORIZED");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(Object.keys(ERROR_CODE_HTTP_STATUS).length).toBeGreaterThanOrEqual(
      20,
    );
  });

  it("isErrorCode validates membership", () => {
    expect(isErrorCode("AUTH_FORBIDDEN")).toBe(true);
    expect(isErrorCode("NOT_A_CODE")).toBe(false);
  });

  it("maps CONTEXT_LIMIT_EXCEEDED to 422", () => {
    expect(ErrorCode.CONTEXT_LIMIT_EXCEEDED).toBe("CONTEXT_LIMIT_EXCEEDED");
    expect(ERROR_CODE_HTTP_STATUS[ErrorCode.CONTEXT_LIMIT_EXCEEDED]).toBe(422);
    expect(isErrorCode("CONTEXT_LIMIT_EXCEEDED")).toBe(true);
  });
});
