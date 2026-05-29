import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuthSessionController } from "./auth-session.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AuthSessionController", () => {
  it("returns session DTO", async () => {
    const authSessionService = {
      buildSession: vi.fn().mockReturnValue({ userId: "u1", role: "lawyer" }),
    };
    const controller = new AuthSessionController(
      authSessionService as never,
      "x-request-id",
    );

    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      {
        requestId: "r1",
        method: "GET",
        path: "/api/auth/session",
        auth: createAuthContext({
          userId: "u1",
          role: "lawyer",
          username: "lawyer",
          requiresPasswordChange: false,
        }),
        profile: {
          id: "u1",
          username: "lawyer",
          displayName: "L",
          role: "lawyer",
          contact: null,
          status: "enabled",
          requiresPasswordChange: false,
          mfaEnabled: false,
        },
      },
      () => controller.handle({} as never, res),
    );

    expect(JSON.parse(body).data.userId).toBe("u1");
  });
});
