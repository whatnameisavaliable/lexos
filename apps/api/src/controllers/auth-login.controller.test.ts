import { describe, expect, it, vi } from "vitest";
import { AuthLoginController } from "./auth-login.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AuthLoginController", () => {
  it("returns login result on valid body", async () => {
    const authLoginService = {
      login: vi.fn().mockResolvedValue({
        accessToken: "at",
        refreshToken: "rt",
        userId: "u1",
      }),
    };
    const controller = new AuthLoginController(
      authLoginService as never,
      "x-request-id",
    );

    const req = {
      method: "POST",
      headers: {},
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(
          JSON.stringify({ username: "admin", password: "secret" }),
        );
      },
    } as never;

    let body = "";
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (chunk: string) => {
        body = chunk;
      },
    } as never;

    await runWithRequestContext(
      { requestId: "r1", method: "POST", path: "/api/auth/login" },
      () => controller.handle(req, res),
    );

    expect(JSON.parse(body).data.accessToken).toBe("at");
  });
});
