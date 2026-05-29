import { describe, expect, it } from "vitest";
import { createAuthContext } from "./auth-context.js";
import { UserRole } from "./user-role.js";

describe("AuthContext", () => {
  it("createAuthContext maps profile fields", () => {
    const ctx = createAuthContext({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      role: UserRole.LAWYER,
      username: "lawyer_tom",
      requiresPasswordChange: true,
      sessionId: "sess-1",
    });

    expect(ctx).toEqual({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      role: "lawyer",
      username: "lawyer_tom",
      requiresPasswordChange: true,
      sessionId: "sess-1",
    });
  });

  it("omits sessionId when not provided", () => {
    const ctx = createAuthContext({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      role: UserRole.ADMIN,
      username: "admin",
      requiresPasswordChange: false,
    });

    expect(ctx.sessionId).toBeUndefined();
    expect("sessionId" in ctx).toBe(false);
  });
});
