import { afterEach, describe, expect, it } from "vitest";
import {
  loadSupabaseEnvFromProcess,
  requireEnv,
} from "./env.js";

describe("requireEnv", () => {
  const original = process.env.TEST_REQUIRE_ENV;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TEST_REQUIRE_ENV;
    } else {
      process.env.TEST_REQUIRE_ENV = original;
    }
  });

  it("returns trimmed value when set", () => {
    process.env.TEST_REQUIRE_ENV = "  value  ";
    expect(requireEnv("TEST_REQUIRE_ENV")).toBe("value");
  });

  it("throws when missing or empty", () => {
    delete process.env.TEST_REQUIRE_ENV;
    expect(() => requireEnv("TEST_REQUIRE_ENV")).toThrow(
      /Missing required environment variable: TEST_REQUIRE_ENV/,
    );
  });
});

describe("loadSupabaseEnvFromProcess", () => {
  const keys = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_JWT_SECRET",
    "SUPABASE_DB_URL",
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

  it("maps all SUPABASE_* keys", () => {
    for (const key of keys) {
      snapshot[key] = process.env[key];
    }
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.SUPABASE_JWT_SECRET = "jwt";
    process.env.SUPABASE_DB_URL = "postgresql://localhost/postgres";

    const cfg = loadSupabaseEnvFromProcess();
    expect(cfg.supabaseUrl).toBe("https://example.supabase.co");
    expect(cfg.supabaseAnonKey).toBe("anon");
  });
});
