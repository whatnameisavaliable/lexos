import { describe, expect, it, vi } from "vitest";
import { HealthCheckService } from "./health-check.service.js";

describe("HealthCheckService", () => {
  const okStorage = {
    pingBuckets: vi.fn().mockResolvedValue({
      media: { ok: true, bucket: "media", latencyMs: 2 },
      exports: { ok: true, bucket: "exports", latencyMs: 3 },
    }),
  };

  it("returns unhealthy when postgres fails", async () => {
    const service = new HealthCheckService(
      {
        ping: vi.fn().mockResolvedValue({ ok: false, errorMessage: "db down" }),
      },
      okStorage,
    );
    const report = await service.runChecks();
    expect(report.status).toBe("unhealthy");
    expect(report.checks.postgres.ok).toBe(false);
  });

  it("returns unhealthy when storage media bucket fails", async () => {
    const service = new HealthCheckService(
      {
        ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
      },
      {
        pingBuckets: vi.fn().mockResolvedValue({
          media: { ok: false, bucket: "media", errorMessage: "not found" },
          exports: { ok: true, bucket: "exports", latencyMs: 1 },
        }),
      },
    );
    const report = await service.runChecks();
    expect(report.status).toBe("unhealthy");
    expect(report.checks.storage.media.ok).toBe(false);
  });

  it("returns unhealthy when storage exports bucket fails", async () => {
    const service = new HealthCheckService(
      {
        ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
      },
      {
        pingBuckets: vi.fn().mockResolvedValue({
          media: { ok: true, bucket: "media", latencyMs: 1 },
          exports: { ok: false, bucket: "exports", errorMessage: "denied" },
        }),
      },
    );
    expect((await service.runChecks()).status).toBe("unhealthy");
  });

  it("returns ok when postgres and storage succeed", async () => {
    const service = new HealthCheckService(
      {
        ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
      },
      okStorage,
    );
    const report = await service.runChecks();
    expect(report.status).toBe("ok");
    expect(report.checks.postgres.ok).toBe(true);
    expect(report.checks.storage.media.ok).toBe(true);
    expect(report.checks.storage.exports.ok).toBe(true);
  });
});
