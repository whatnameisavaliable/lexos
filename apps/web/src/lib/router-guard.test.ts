import { describe, expect, it } from "vitest";
import {
  resolveGuardRedirect,
  resolvePostLoginPath,
} from "./router-guard.js";

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

  const directorSession = {
    ...adminSession,
    role: "director",
    username: "director",
  };

  it("allows admin on /admin/users", () => {
    expect(resolveGuardRedirect("/admin/users", adminSession)).toBeNull();
  });

  it("redirects lawyer from /admin/users to unauthorized", () => {
    expect(resolveGuardRedirect("/admin/users", lawyerSession)).toBe(
      "/unauthorized",
    );
  });

  it("redirects admin from lawyer business routes to /admin", () => {
    expect(resolveGuardRedirect("/transcription", adminSession)).toBe("/admin");
    expect(resolveGuardRedirect("/drive", adminSession)).toBe("/admin");
    expect(resolveGuardRedirect("/lawyer", adminSession)).toBe("/admin");
    expect(resolveGuardRedirect("/admin/transcription", adminSession)).toBe(
      "/admin",
    );
  });

  it("allows reserved role on profile and coming-soon only", () => {
    expect(resolveGuardRedirect("/coming-soon", directorSession)).toBeNull();
    expect(resolveGuardRedirect("/profile", directorSession)).toBeNull();
    expect(resolveGuardRedirect("/change-password", directorSession)).toBeNull();
    expect(resolveGuardRedirect("/transcription", directorSession)).toBe(
      "/coming-soon",
    );
    expect(resolveGuardRedirect("/lawyer", directorSession)).toBe(
      "/coming-soon",
    );
  });

  it("allows voluntary change-password while logged in", () => {
    expect(resolveGuardRedirect("/change-password", lawyerSession)).toBeNull();
    expect(resolveGuardRedirect("/change-password", adminSession)).toBeNull();
  });

  it("redirects logged-in user away from login", () => {
    expect(resolveGuardRedirect("/login", lawyerSession)).toBe("/lawyer");
    expect(resolveGuardRedirect("/login", adminSession)).toBe("/admin");
    expect(resolveGuardRedirect("/login", directorSession)).toBe("/coming-soon");
  });

  it("forces change-password when flag is set", () => {
    const forced = { ...lawyerSession, requiresPasswordChange: true };
    expect(resolveGuardRedirect("/lawyer", forced)).toBe("/change-password");
    expect(resolveGuardRedirect("/change-password", forced)).toBeNull();
  });
});

describe("resolvePostLoginPath", () => {
  it("returns role-specific home paths", () => {
    expect(resolvePostLoginPath("admin")).toBe("/admin");
    expect(resolvePostLoginPath("lawyer")).toBe("/lawyer");
    expect(resolvePostLoginPath("director")).toBe("/coming-soon");
  });
});
