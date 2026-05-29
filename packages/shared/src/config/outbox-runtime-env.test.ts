import { afterEach, describe, expect, it } from "vitest";
import { loadOutboxRuntimeEnvFromProcess } from "./outbox-runtime-env.js";

describe("loadOutboxRuntimeEnvFromProcess", () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it("defaults OUTBOX_DB_URL to SUPABASE_DB_URL", () => {
    process.env.SUPABASE_DB_URL = "postgres://localhost/db";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    delete process.env.OUTBOX_DB_URL;
    delete process.env.OUTBOX_POLL_INTERVAL_MS;
    delete process.env.OUTBOX_MAX_ATTEMPTS;

    const config = loadOutboxRuntimeEnvFromProcess();
    expect(config.outboxDbUrl).toBe("postgres://localhost/db");
    expect(config.outboxPollIntervalMs).toBe(1000);
    expect(config.outboxMaxAttempts).toBe(20);
  });
});
