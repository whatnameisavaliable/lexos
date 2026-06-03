import { describe, expect, it } from "vitest";
import { isPathAllowedForRole, resolveGuardRedirect } from "./router-guard.js";

describe("router guard lawyer /sops", () => {
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

  it("allows lawyer on /sops", () => {
    expect(resolveGuardRedirect("/sops", lawyerSession)).toBeNull();
    expect(isPathAllowedForRole("/sops/pipelines/x", "lawyer")).toBe(true);
  });

  it("redirects admin from /sops to /admin", () => {
    expect(resolveGuardRedirect("/sops", adminSession)).toBe("/admin");
    expect(isPathAllowedForRole("/sops", "admin")).toBe(false);
  });
});
