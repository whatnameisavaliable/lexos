import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuthLogoutController } from "./auth-logout.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AuthLogoutController", () => {
  it("delegates to logout service", async () => {
    const service = { logout: vi.fn().mockResolvedValue(undefined) };
    const controller = new AuthLogoutController(service as never, "x-request-id");

    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: () => undefined,
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "POST",
        path: "/api/auth/logout",
        accessToken: "at",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "lawyer",
          requiresPasswordChange: false,
        }),
      },
      () => controller.handle({ headers: {} } as never, res),
    );

    expect(service.logout).toHaveBeenCalled();
  });
});
