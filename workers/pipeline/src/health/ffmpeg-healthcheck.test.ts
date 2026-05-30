import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import {
  assertFfmpegAvailable,
  checkFfmpegHealth,
} from "./ffmpeg-healthcheck.js";

function mockSpawnSuccess(versionLine: string) {
  return vi.fn(() => {
    const stdout = new EventEmitter();
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      kill: ReturnType<typeof vi.fn>;
    };
    child.stdout = stdout;
    child.kill = vi.fn();
    queueMicrotask(() => {
      stdout.emit("data", `${versionLine}\n`);
      child.emit("close", 0);
    });
    return child;
  });
}

function mockSpawnFailure(message: string) {
  return vi.fn(() => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      kill: ReturnType<typeof vi.fn>;
    };
    child.stdout = new EventEmitter();
    child.kill = vi.fn();
    queueMicrotask(() => {
      child.emit("error", new Error(message));
    });
    return child;
  });
}

describe("ffmpeg-healthcheck", () => {
  it("returns ok when ffmpeg -version succeeds", async () => {
    const spawnFn = mockSpawnSuccess("ffmpeg version 6.0");
    const result = await checkFfmpegHealth("ffmpeg", spawnFn as never);
    expect(result.ok).toBe(true);
    expect(result.versionLine).toBe("ffmpeg version 6.0");
  });

  it("assertFfmpegAvailable throws when spawn fails", async () => {
    const spawnFn = mockSpawnFailure("ENOENT");
    await expect(
      assertFfmpegAvailable("missing-ffmpeg", spawnFn as never),
    ).rejects.toThrow(/FFmpeg health check failed/);
  });

  it("assertFfmpegAvailable returns version line on success", async () => {
    const spawnFn = mockSpawnSuccess("ffmpeg version 7.0");
    await expect(
      assertFfmpegAvailable("ffmpeg", spawnFn as never),
    ).resolves.toBe("ffmpeg version 7.0");
  });
});
