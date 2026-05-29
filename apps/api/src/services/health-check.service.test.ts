import { describe, expect, it, vi } from "vitest";
import { HealthCheckService } from "./health-check.service.js";

describe("HealthCheckService", () => {
  it("returns unhealthy when postgres fails", async () => {
    const service = new HealthCheckService({
      ping: vi.fn().mockResolvedValue({ ok: false, errorMessage: "db down" }),
    });
    const report = await service.runChecks();
    expect(report.status).toBe("unhealthy");
  });

  it("returns ok when postgres succeeds", async () => {
    const service = new HealthCheckService({
      ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
    });
    expect((await service.runChecks()).status).toBe("ok");
  });
});
