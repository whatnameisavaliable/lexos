import { afterEach, describe, expect, it } from "vitest";
import {
  loadAuthRuntimeEnvFromProcess,
  parseMfaRequiredRoles,
} from "./auth-runtime-env.js";

describe("parseMfaRequiredRoles", () => {
  it("parses comma-separated roles", () => {
    expect(parseMfaRequiredRoles("admin, director")).toEqual([
      "admin",
      "director",
    ]);
  });

  it("rejects unknown roles", () => {
    expect(() => parseMfaRequiredRoles("admin,invalid")).toThrow(
      /Invalid MFA_REQUIRED_ROLES/,
    );
  });
});

describe("loadAuthRuntimeEnvFromProcess", () => {
  const keys = [
    "AUTH_VIRTUAL_EMAIL_DOMAIN",
    "CAPTCHA_PROVIDER",
    "CAPTCHA_SECRET_KEY",
    "MFA_REQUIRED_ROLES",
  ] as const;
  const snapshot: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of keys) {
      if (snapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    }
  });

  it("loads none captcha config", () => {
    for (const key of keys) {
      snapshot[key] = process.env[key];
    }
    process.env.AUTH_VIRTUAL_EMAIL_DOMAIN = "llexos.internal";
    process.env.CAPTCHA_PROVIDER = "none";
    delete process.env.CAPTCHA_SECRET_KEY;
    process.env.MFA_REQUIRED_ROLES = "admin,director";

    const cfg = loadAuthRuntimeEnvFromProcess();
    expect(cfg.captchaProvider).toBe("none");
    expect(cfg.mfaRequiredRoles).toEqual(["admin", "director"]);
  });
});
