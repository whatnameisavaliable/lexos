import { describe, expect, it, vi } from "vitest";
import { mapProfileRow } from "./profile.types.js";

describe("mapProfileRow", () => {
  it("maps snake_case database row", () => {
    const record = mapProfileRow({
      id: "u1",
      username: "lawyer",
      display_name: "律师",
      role: "lawyer",
      contact: null,
      status: "enabled",
      requires_password_change: false,
      mfa_enabled: false,
    });

    expect(record.displayName).toBe("律师");
    expect(record.requiresPasswordChange).toBe(false);
  });
});

describe("ProfileRepository", () => {
  it("module exports ProfileRepository class", async () => {
    const mod = await import("./profile.repository.js");
    expect(mod.ProfileRepository).toBeDefined();
  });
});
