import { afterEach, describe, expect, it } from "vitest";
import { loadWorkerRuntimeEnvFromProcess } from "./worker-runtime-env.js";

describe("loadWorkerRuntimeEnvFromProcess", () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it("loads worker config without REDIS_URL", () => {
    process.env.SUPABASE_DB_URL = "postgres://localhost/db";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    delete process.env.REDIS_URL;
    delete process.env.WORKER_DB_URL;
    delete process.env.FFMPEG_PATH;
    delete process.env.WORKER_MAX_CONCURRENCY;
    delete process.env.ASR_RATE_LIMIT_MAX;

    const config = loadWorkerRuntimeEnvFromProcess();
    expect(config.outboxDbUrl).toBe("postgres://localhost/db");
    expect(config.ffmpegPath).toBe("ffmpeg");
    expect(config.workerMaxConcurrency).toBe(5);
    expect(config.asrRateLimitMax).toBe(50);
  });

  it("prefers WORKER_DB_URL for outboxDbUrl", () => {
    process.env.WORKER_DB_URL = "postgres://worker/db";
    process.env.SUPABASE_DB_URL = "postgres://supabase/db";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";

    expect(loadWorkerRuntimeEnvFromProcess().outboxDbUrl).toBe(
      "postgres://worker/db",
    );
  });

  it("rejects empty FFMPEG_PATH", () => {
    process.env.SUPABASE_DB_URL = "postgres://localhost/db";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    process.env.FFMPEG_PATH = "   ";

    expect(() => loadWorkerRuntimeEnvFromProcess()).toThrow(/FFMPEG_PATH/);
  });
});
