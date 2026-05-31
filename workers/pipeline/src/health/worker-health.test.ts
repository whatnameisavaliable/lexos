import { describe, expect, it, vi } from "vitest";
import {
  formatWorkerHealthLogLine,
  runWorkerHealthCheck,
} from "./worker-health.js";

vi.mock("./ffmpeg-healthcheck.js", () => ({
  checkFfmpegHealth: vi.fn(),
}));

import { checkFfmpegHealth } from "./ffmpeg-healthcheck.js";

describe("runWorkerHealthCheck", () => {
  it("returns ok when ffmpeg is available", async () => {
    vi.mocked(checkFfmpegHealth).mockResolvedValue({
      ok: true,
      versionLine: "ffmpeg version 6.0",
    });
    const report = await runWorkerHealthCheck("/usr/bin/ffmpeg");
    expect(report.status).toBe("ok");
    expect(report.checks.ffmpeg.path).toBe("/usr/bin/ffmpeg");
    expect(report.checks.ffmpeg.versionLine).toContain("ffmpeg");
  });

  it("returns unhealthy when ffmpeg fails", async () => {
    vi.mocked(checkFfmpegHealth).mockResolvedValue({
      ok: false,
      errorMessage: "ENOENT",
    });
    const report = await runWorkerHealthCheck("ffmpeg");
    expect(report.status).toBe("unhealthy");
  });
});

describe("formatWorkerHealthLogLine", () => {
  it("formats ok report", () => {
    const line = formatWorkerHealthLogLine({
      status: "ok",
      checks: {
        ffmpeg: { ok: true, path: "/usr/bin/ffmpeg", versionLine: "ffmpeg version 6.0" },
      },
    });
    expect(line).toContain("health ok");
    expect(line).toContain("ffmpeg version 6.0");
  });

  it("formats unhealthy report", () => {
    const line = formatWorkerHealthLogLine({
      status: "unhealthy",
      checks: {
        ffmpeg: { ok: false, path: "ffmpeg", errorMessage: "not found" },
      },
    });
    expect(line).toContain("unhealthy");
    expect(line).toContain("not found");
  });
});
