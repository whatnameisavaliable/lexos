import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuthChangePasswordController } from "./auth-change-password.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AuthChangePasswordController", () => {
  it("calls change password service", async () => {
    const service = {
      changePassword: vi.fn().mockResolvedValue({
        accessToken: "new-at",
        expiresAt: 1,
      }),
    };
    const controller = new AuthChangePasswordController(
      service as never,
      "x-request-id",
    );

    const req = {
      headers: {},
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(JSON.stringify({ newPassword: "long-enough" }));
      },
    } as never;

    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: () => undefined,
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "POST",
        path: "/api/auth/change-password",
        accessToken: "at",
        auth: createAuthContext({
          userId: "u1",
          role: "admin",
          username: "admin",
          requiresPasswordChange: true,
        }),
      },
      () => controller.handle(req, res),
    );

    expect(service.changePassword).toHaveBeenCalled();
  });
});
