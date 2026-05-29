import { describe, expect, it } from "vitest";
import { resolveGuardRedirect } from "./router-guard.js";

describe("resolveGuardRedirect", () => {
  const adminSession = {
    userId: "1",
    username: "admin",
    displayName: "Admin",
    role: "admin",
    contact: null,
    requiresPasswordChange: false,
    mfaEnabled: false,
    status: "enabled",
  };

  const lawyerSession = { ...adminSession, role: "lawyer", username: "lawyer" };

  it("allows admin on /admin/users", () => {
    expect(resolveGuardRedirect("/admin/users", adminSession)).toBeNull();
  });

  it("redirects lawyer from /admin/users to unauthorized", () => {
    expect(resolveGuardRedirect("/admin/users", lawyerSession)).toBe(
      "/unauthorized",
    );
  });
});
