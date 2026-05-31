import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import {
  FfmpegRunner,
  assertFfmpegArgsAllowed,
  isSafeFfmpegPathOrFileArg,
  type SpawnFn,
} from "./ffmpeg.runner.js";

function mockSpawn(exitCode: number, stderr = ""): SpawnFn {
  return vi.fn(() => {
    const stdout = new EventEmitter();
    const stderrStream = new EventEmitter();
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      kill: ReturnType<typeof vi.fn>;
    };
    child.stdout = stdout;
    child.stderr = stderrStream;
    child.kill = vi.fn();
    queueMicrotask(() => {
      if (stderr) {
        stderrStream.emit("data", stderr);
      }
      child.emit("close", exitCode);
    });
    return child as never;
  });
}

describe("FfmpegRunner", () => {
  it("rejects shell injection in ffmpeg arguments", () => {
    expect(() =>
      assertFfmpegArgsAllowed(["-i", "input.mp4", "$(malicious)"]),
    ).toThrow(/Disallowed ffmpeg argument/);
    expect(isSafeFfmpegPathOrFileArg("$(malicious)")).toBe(false);
  });

  it("allows ffmpeg segment output template paths on Windows", () => {
    const segmentPath =
      "D:\\tmp\\lexos\\task-1\\segment_%03d.mp3";
    expect(isSafeFfmpegPathOrFileArg(segmentPath)).toBe(true);
    expect(() =>
      assertFfmpegArgsAllowed([
        "-i",
        "D:\\tmp\\lexos\\task-1\\source_audio",
        segmentPath,
      ]),
    ).not.toThrow();
  });

  it("runs ffmpeg with exit code 0", async () => {
    const spawnFn = mockSpawn(0);
    const runner = new FfmpegRunner(2, spawnFn);
    const result = await runner.run({
      ffmpegPath: "ffmpeg",
      args: ["-i", "in.mp4", "-vn", "out.mp3"],
      timeoutMs: 5000,
    });
    expect(result.exitCode).toBe(0);
    expect(spawnFn).toHaveBeenCalledWith("ffmpeg", [
      "-i",
      "in.mp4",
      "-vn",
      "out.mp3",
    ]);
  });

  it("returns non-zero exit code without throwing", async () => {
    const runner = new FfmpegRunner(1, mockSpawn(1, "error"));
    const result = await runner.run({
      ffmpegPath: "ffmpeg",
      args: ["-i", "bad.mp4", "out.mp3"],
      timeoutMs: 5000,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("error");
  });
});
