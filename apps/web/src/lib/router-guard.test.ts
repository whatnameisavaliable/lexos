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

  it("redirects lawyer from /admin/ai to unauthorized", () => {
    expect(resolveGuardRedirect("/admin/ai", lawyerSession)).toBe(
      "/unauthorized",
    );
  });

  it("allows voluntary change-password while logged in", () => {
    expect(resolveGuardRedirect("/change-password", lawyerSession)).toBeNull();
    expect(resolveGuardRedirect("/change-password", adminSession)).toBeNull();
  });

  it("redirects logged-in user away from login only", () => {
    expect(resolveGuardRedirect("/login", lawyerSession)).toBe("/lawyer");
    expect(resolveGuardRedirect("/login", adminSession)).toBe("/admin");
  });

  it("forces change-password when flag is set", () => {
    const forced = { ...lawyerSession, requiresPasswordChange: true };
    expect(resolveGuardRedirect("/lawyer", forced)).toBe("/change-password");
    expect(resolveGuardRedirect("/change-password", forced)).toBeNull();
  });
});
