import { describe, expect, it, vi } from "vitest";
import { AuthRefreshService } from "./auth-refresh.service.js";

describe("AuthRefreshService", () => {
  it("returns new tokens when profile is active", async () => {
    const authAdapter = {
      refreshSession: vi.fn().mockResolvedValue({
        accessToken: "at-new",
        refreshToken: "rt-new",
        userId: "u1",
        expiresAt: 999,
      }),
    };
    const profileRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "u1",
        role: "lawyer",
        status: "active",
        requiresPasswordChange: false,
      }),
    };

    const service = new AuthRefreshService(
      authAdapter as never,
      profileRepository as never,
    );

    const result = await service.refresh({ refreshToken: "rt-old" });
    expect(result.accessToken).toBe("at-new");
    expect(result.refreshToken).toBe("rt-new");
    expect(result.role).toBe("lawyer");
  });
});
