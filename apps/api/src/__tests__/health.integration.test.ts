import { describe, expect, it, vi } from "vitest";
import { HealthController } from "../controllers/health.controller.js";
import { HealthCheckService } from "../services/health-check.service.js";

describe("GET /health integration (mocked dependencies)", () => {
  it("returns 200 with full checks structure when all subsystems ok", async () => {
    const service = new HealthCheckService(
      {
        ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 5 }),
      },
      {
        pingBuckets: vi.fn().mockResolvedValue({
          media: { ok: true, bucket: "media", latencyMs: 10 },
          exports: { ok: true, bucket: "exports", latencyMs: 12 },
        }),
      },
    );
    const controller = new HealthController(service);
    const result = await controller.getHealth("req-integration-1");

    expect(result.statusCode).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data?.status).toBe("ok");
    expect(result.body.data?.checks.postgres).toMatchObject({ ok: true });
    expect(result.body.data?.checks.storage.media).toMatchObject({
      ok: true,
      bucket: "media",
    });
    expect(result.body.data?.checks.storage.exports).toMatchObject({
      ok: true,
      bucket: "exports",
    });
    expect(result.body.meta?.requestId).toBe("req-integration-1");
  });

  it("returns 503 when any subsystem is unhealthy", async () => {
    const service = new HealthCheckService(
      {
        ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
      },
      {
        pingBuckets: vi.fn().mockResolvedValue({
          media: { ok: false, bucket: "media", errorMessage: "missing" },
          exports: { ok: true, bucket: "exports", latencyMs: 1 },
        }),
      },
    );
    const controller = new HealthController(service);
    const result = await controller.getHealth("req-integration-2");

    expect(result.statusCode).toBe(503);
    expect(result.body.data?.status).toBe("unhealthy");
    expect(result.body.data?.checks.storage.media.ok).toBe(false);
  });
});
