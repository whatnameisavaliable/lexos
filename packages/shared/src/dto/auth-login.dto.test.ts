import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  authLoginNormalizedUsername,
  authLoginBodySchema,
  parseAuthLoginBody,
} from "./auth-login.dto.js";

describe("authLoginBodySchema", () => {
  it("accepts minimal login payload", () => {
    const body = parseAuthLoginBody({
      username: "Lawyer_Tom",
      password: "secret",
    });

    expect(body.username).toBe("lawyer_tom");
    expect(authLoginNormalizedUsername(body)).toBe("lawyer_tom");
    expect(body.password).toBe("secret");
    expect(body.captchaToken).toBeUndefined();
    expect(body.totpCode).toBeUndefined();
  });

  it("accepts captcha and totp", () => {
    const body = parseAuthLoginBody({
      username: "admin",
      password: "x",
      captchaToken: "cf-token",
      totpCode: "123456",
    });

    expect(body.captchaToken).toBe("cf-token");
    expect(body.totpCode).toBe("123456");
  });

  it("rejects invalid username characters", () => {
    expect(() =>
      parseAuthLoginBody({ username: "bad-name", password: "x" }),
    ).toThrow(ZodError);
  });

  it("rejects invalid totp format", () => {
    expect(() =>
      parseAuthLoginBody({
        username: "admin",
        password: "x",
        totpCode: "12",
      }),
    ).toThrow(ZodError);
  });

  it("schema matches exported type shape", () => {
    const keys = Object.keys(authLoginBodySchema.shape).sort();
    expect(keys).toEqual(["captchaToken", "password", "totpCode", "username"]);
  });
});
