import { afterEach, describe, expect, it } from "vitest";
import {
  BUILTIN_ADMIN_USERNAME,
  loadAuthSeedEnvFromProcess,
  resolveVirtualEmail,
} from "./auth-env.js";

describe("resolveVirtualEmail", () => {
  it("maps username to virtual email", () => {
    expect(resolveVirtualEmail("Admin", "llexos.internal")).toBe(
      "admin@llexos.internal",
    );
  });
});

describe("loadAuthSeedEnvFromProcess", () => {
  const keys = ["AUTH_VIRTUAL_EMAIL_DOMAIN", "AUTH_INITIAL_PASSWORD"] as const;
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

  it("loads auth seed variables", () => {
    for (const key of keys) {
      snapshot[key] = process.env[key];
    }
    process.env.AUTH_VIRTUAL_EMAIL_DOMAIN = "llexos.internal";
    process.env.AUTH_INITIAL_PASSWORD = "test-password";

    const cfg = loadAuthSeedEnvFromProcess();
    expect(cfg.builtinAdminUsername).toBe(BUILTIN_ADMIN_USERNAME);
    expect(cfg.authVirtualEmailDomain).toBe("llexos.internal");
    expect(cfg.authInitialPassword).toBe("test-password");
  });
});
