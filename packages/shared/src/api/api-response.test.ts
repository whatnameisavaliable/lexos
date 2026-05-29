import { describe, expect, it } from "vitest";
import { ErrorCode } from "./error-code.js";
import {
  createApiError,
  createApiSuccess,
  isApiErrorResponse,
} from "./api-response.js";

describe("ApiResponse helpers", () => {
  it("createApiSuccess wraps data", () => {
    const res = createApiSuccess({ ok: true }, { requestId: "req-1" });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ ok: true });
    expect(res.meta?.requestId).toBe("req-1");
  });

  it("createApiError wraps error body", () => {
    const res = createApiError({
      code: ErrorCode.VALIDATION_FAILED,
      message: "invalid",
      requestId: "req-2",
    });
    expect(isApiErrorResponse(res)).toBe(true);
    expect(res.error.code).toBe(ErrorCode.VALIDATION_FAILED);
  });
});
