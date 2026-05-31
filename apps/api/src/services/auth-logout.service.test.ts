import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuthLogoutService } from "./auth-logout.service.js";

describe("AuthLogoutService", () => {
  it("signs out and appends audit log", async () => {
    const authAdapter = { signOut: vi.fn().mockResolvedValue(undefined) };
    const auditWriterService = { write: vi.fn().mockResolvedValue("id") };
    const service = new AuthLogoutService(
      authAdapter as never,
      auditWriterService as never,
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
    expect(auditWriterService.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.logout" }),
      expect.any(Object),
    );
  });
});
