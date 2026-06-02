import { describe, expect, it } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuthSessionService } from "./auth-session.service.js";

describe("AuthSessionService", () => {
  it("builds session DTO from auth and profile", () => {
    const service = new AuthSessionService();
    const dto = service.buildSession(
      createAuthContext({
        userId: "u1",
        role: "admin",
        username: "admin",
        requiresPasswordChange: true,
      }),
      {
        id: "u1",
        username: "admin",
        displayName: "管理�?,
        role: "admin",
        contact: "x@example.com",
        status: "enabled",
        requiresPasswordChange: true,
        mfaEnabled: true,
      },
    );

    expect(dto.mfaEnabled).toBe(true);
    expect(dto.requiresPasswordChange).toBe(true);
    expect(dto.displayName).toBe("管理�?);
  });
});
