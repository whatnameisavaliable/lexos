import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuthLogoutService } from "./auth-logout.service.js";

describe("AuthLogoutService", () => {
  it("signs out and appends audit log", async () => {
    const authAdapter = { signOut: vi.fn().mockResolvedValue(undefined) };
    const auditLogRepository = { append: vi.fn().mockResolvedValue("id") };
    const service = new AuthLogoutService(
      authAdapter as never,
      auditLogRepository as never,
    );

    await service.logout(
      createAuthContext({
        userId: "u1",
        role: "lawyer",
        username: "lawyer",
        requiresPasswordChange: false,
      }),
      "token",
    );

    expect(authAdapter.signOut).toHaveBeenCalledWith("token");
    expect(auditLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.logout" }),
    );
  });
});
