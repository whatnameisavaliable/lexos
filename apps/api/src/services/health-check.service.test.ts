import { describe, expect, it, vi } from "vitest";
import { HealthCheckService } from "./health-check.service.js";

describe("HealthCheckService", () => {
  it("returns unhealthy when postgres fails", async () => {
    const service = new HealthCheckService(
      { ping: vi.fn().mockResolvedValue({ ok: false, errorMessage: "db down" }) },
      { ping: vi.fn().mockResolvedValue({ ok: true }) },
    );
    const report = await service.runChecks();
    expect(report.status).toBe("unhealthy");
  });

  it("returns degraded when only redis fails", async () => {
    const service = new HealthCheckService(
      { ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 1 }) },
      {
        ping: vi.fn().mockResolvedValue({
          ok: false,
          warning: "Redis unreachable",
        }),
      },
    );
    const report = await service.runChecks();
    expect(report.status).toBe("degraded");
    expect(report.checks.redis.warning).toContain("Redis");
  });

  it("returns ok when both succeed", async () => {
    const service = new HealthCheckService(
      { ping: vi.fn().mockResolvedValue({ ok: true }) },
      { ping: vi.fn().mockResolvedValue({ ok: true }) },
    );
    expect((await service.runChecks()).status).toBe("ok");
  });
});
