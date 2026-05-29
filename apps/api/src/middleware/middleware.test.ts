import { describe, expect, it } from "vitest";
import { AuthErrorCode } from "@lexos/shared";
import { httpStatusForErrorCode } from "./error-handler.middleware.js";
import { PASSWORD_CHANGE_WHITELIST_PATHS } from "./password-change-gate.middleware.js";
import { requireRoles } from "./role-gate.factory.js";
import { parseBearerToken } from "./auth.middleware.js";
import { runWithRequestContext } from "./request-context.js";
import type { IncomingMessage } from "node:http";

describe("httpStatusForErrorCode", () => {
  it("maps auth codes", () => {
    expect(httpStatusForErrorCode(AuthErrorCode.AUTH_UNAUTHORIZED)).toBe(401);
    expect(httpStatusForErrorCode(AuthErrorCode.AUTH_FORBIDDEN)).toBe(403);
  });
});

describe("PASSWORD_CHANGE_WHITELIST_PATHS", () => {
  it("includes change-password session logout", () => {
    expect(PASSWORD_CHANGE_WHITELIST_PATHS).toContain(
      "/api/auth/change-password",
    );
  });
});

describe("parseBearerToken", () => {
  it("extracts bearer token", () => {
    const req = {
      headers: { authorization: "Bearer abc.def.ghi" },
    } as IncomingMessage;
    expect(parseBearerToken(req)).toBe("abc.def.ghi");
  });

  it("returns null when missing", () => {
    expect(parseBearerToken({ headers: {} } as IncomingMessage)).toBeNull();
  });
});

describe("requireRoles", () => {
  it("denies when role not allowed", () => {
    const res = { writableEnded: false, statusCode: 0, end: () => undefined };
    let ended = false;
    const mockRes = {
      ...res,
      setHeader: () => undefined,
      end: (body: string) => {
        ended = true;
        expect(body).toContain("AUTH_FORBIDDEN");
      },
    } as unknown as import("node:http").ServerResponse;

    runWithRequestContext(
      {
        requestId: "r1",
        method: "GET",
        path: "/api/profile",
        auth: {
          userId: "u1",
          role: "lawyer",
          username: "lawyer",
          requiresPasswordChange: false,
        },
      },
      () => {
        const gate = requireRoles("admin");
        expect(gate(mockRes)).toBe(false);
      },
    );
    expect(ended).toBe(true);
  });
});
