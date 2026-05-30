import { spawn } from "node:child_process";

/** FFmpeg 健康检查结果。 */
export interface FfmpegHealthCheckResult {
  readonly ok: boolean;
  readonly versionLine?: string;
  readonly errorMessage?: string;
}

/**
 * 探测 FFmpeg 是否可用（`architecture.md` §4.4.1）。
 *
 * @param ffmpegPath - `FFMPEG_PATH` 环境变量值
 * @param spawnFn - 可注入的 spawn 实现（测试用）
 */
export async function checkFfmpegHealth(
  ffmpegPath: string,
  spawnFn: typeof spawn = spawn,
): Promise<FfmpegHealthCheckResult> {
  return new Promise((resolve) => {
    const child = spawnFn(ffmpegPath, ["-version"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += String(chunk);
    });

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({
        ok: false,
        errorMessage: "ffmpeg -version timed out",
      });
    }, 10_000);

    child.on("error", (error) => {
      clearTimeout(timeout);
      resolve({
        ok: false,
        errorMessage: error.message,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        resolve({
          ok: false,
          errorMessage: `ffmpeg -version exited with code ${String(code)}`,
        });
        return;
      }
      const versionLine = stdout.split("\n")[0]?.trim();
      resolve({ ok: true, versionLine });
    });
  });
}

/**
 * 启动前断言 FFmpeg 可用；失败则抛出以便进程退出。
 */
export async function assertFfmpegAvailable(
  ffmpegPath: string,
  spawnFn?: typeof spawn,
): Promise<string> {
  const result = await checkFfmpegHealth(ffmpegPath, spawnFn);
  if (!result.ok) {
    throw new Error(
      `FFmpeg health check failed (${ffmpegPath}): ${result.errorMessage ?? "unknown"}`,
    );
  }
  return result.versionLine ?? "unknown";
}
