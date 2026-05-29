import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  hasCurrentPassword,
  parseAuthChangePasswordBody,
} from "./auth-change-password.dto.js";

describe("authChangePasswordBodySchema", () => {
  it("accepts forced change without currentPassword", () => {
    const body = parseAuthChangePasswordBody({
      newPassword: "new-secure-pass",
    });

    expect(body.currentPassword).toBeUndefined();
    expect(hasCurrentPassword(body)).toBe(false);
  });

  it("accepts voluntary change with currentPassword", () => {
    const body = parseAuthChangePasswordBody({
      currentPassword: "old-pass",
      newPassword: "new-secure-pass",
    });

    expect(hasCurrentPassword(body)).toBe(true);
    expect(body.currentPassword).toBe("old-pass");
  });

  it("rejects short newPassword", () => {
    expect(() =>
      parseAuthChangePasswordBody({ newPassword: "short" }),
    ).toThrow(ZodError);
  });

  it("rejects empty currentPassword when provided", () => {
    expect(() =>
      parseAuthChangePasswordBody({
        currentPassword: "",
        newPassword: "long-enough",
      }),
    ).toThrow(ZodError);
  });
});
