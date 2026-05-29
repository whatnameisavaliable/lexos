import { describe, expect, it } from "vitest";
import {
  AUTH_ERROR_CODE_VALUES,
  AuthErrorCode,
  authErrorHttpStatus,
  isAuthErrorCode,
} from "./auth-error-codes.js";
import { ErrorCode } from "../api/error-code.js";

describe("AuthErrorCode", () => {
  it("defines all architecture.md §6.2 auth codes", () => {
    expect(AUTH_ERROR_CODE_VALUES).toEqual([
      "AUTH_UNAUTHORIZED",
      "AUTH_FORBIDDEN",
      "AUTH_ACCOUNT_DISABLED",
      "AUTH_PASSWORD_CHANGE_REQUIRED",
      "AUTH_INVALID_CREDENTIALS",
      "AUTH_CAPTCHA_REQUIRED",
      "AUTH_MFA_REQUIRED",
    ]);
    expect(AuthErrorCode.AUTH_UNAUTHORIZED).toBe(ErrorCode.AUTH_UNAUTHORIZED);
  });

  it("isAuthErrorCode accepts only auth subset", () => {
    expect(isAuthErrorCode("AUTH_FORBIDDEN")).toBe(true);
    expect(isAuthErrorCode("VALIDATION_FAILED")).toBe(false);
    expect(isAuthErrorCode("NOT_A_CODE")).toBe(false);
  });

  it("authErrorHttpStatus maps to global HTTP table", () => {
    expect(authErrorHttpStatus(AuthErrorCode.AUTH_INVALID_CREDENTIALS)).toBe(
      401,
    );
    expect(authErrorHttpStatus(AuthErrorCode.AUTH_MFA_REQUIRED)).toBe(403);
  });
});
