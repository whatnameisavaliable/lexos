import { describe, expect, it } from "vitest";
import { isPathAllowedForRole, resolveGuardRedirect } from "./router-guard.js";

describe("router guard SOP admin routes", () => {
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

  it("allows admin on /admin/sops", () => {
    expect(resolveGuardRedirect("/admin/sops", adminSession)).toBeNull();
    expect(isPathAllowedForRole("/admin/sops", "admin")).toBe(true);
  });

  it("redirects lawyer from /admin/sops to unauthorized", () => {
    expect(resolveGuardRedirect("/admin/sops", lawyerSession)).toBe("/unauthorized");
    expect(isPathAllowedForRole("/admin/sops", "lawyer")).toBe(false);
  });
});
