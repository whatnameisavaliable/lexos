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

  it("rejects empty newPassword", () => {
    expect(() => parseAuthChangePasswordBody({ newPassword: "" })).toThrow(
      ZodError,
    );
  });

  it("treats empty currentPassword as omitted (forced-change form default)", () => {
    const body = parseAuthChangePasswordBody({
      currentPassword: "",
      newPassword: "x",
    });
    expect(body.currentPassword).toBeUndefined();
    expect(hasCurrentPassword(body)).toBe(false);
  });
});
