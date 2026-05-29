import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ProfileService } from "./profile.service.js";

describe("ProfileService", () => {
  it("maps profile to DTO", () => {
    const service = new ProfileService({} as never);
    const dto = service.getProfile({
      id: "u1",
      username: "lawyer",
      displayName: "律师",
      role: "lawyer",
      contact: null,
      status: "enabled",
      requiresPasswordChange: false,
      mfaEnabled: false,
    });
    expect(dto.username).toBe("lawyer");
  });

  it("updates display name via repository", async () => {
    const profileRepository = {
      updateDisplayContact: vi.fn().mockResolvedValue({
        id: "u1",
        username: "lawyer",
        displayName: "新名",
        role: "lawyer",
        contact: null,
        status: "enabled",
        requiresPasswordChange: false,
        mfaEnabled: false,
      }),
    };
    const service = new ProfileService(profileRepository as never);

    const dto = await service.updateProfile(
      "at",
      createAuthContext({
        userId: "u1",
        role: "lawyer",
        username: "lawyer",
        requiresPasswordChange: false,
      }),
      { displayName: "新名" },
    );

    expect(dto.displayName).toBe("新名");
  });
});
