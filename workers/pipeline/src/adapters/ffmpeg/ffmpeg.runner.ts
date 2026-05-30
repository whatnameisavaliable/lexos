import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import pLimit, { type LimitFunction } from "p-limit";

/** FFmpeg 执行选项。 */
export interface FfmpegRunOptions {
  readonly ffmpegPath: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
}

/** FFmpeg 执行结果。 */
export interface FfmpegRunResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export type SpawnFn = (
  command: string,
  args: readonly string[],
) => ChildProcessWithoutNullStreams;

/**
 * FFmpeg 子进程执行器（参数白名单 · 超时 · 并发限制）。
 */
export class FfmpegRunner {
  private readonly limiter: LimitFunction;

  /**
   * @param maxConcurrent - `FFMPEG_MAX_CONCURRENT`
   * @param spawnFn - 可注入 spawn（测试用）
   */
  constructor(
    maxConcurrent: number,
    private readonly spawnFn: SpawnFn = spawn,
  ) {
    this.limiter = pLimit(maxConcurrent);
  }

  /**
   * 在并发限制下执行 FFmpeg；仅允许 `-` 开头的开关与输入/输出路径参数。
   */
  run(options: FfmpegRunOptions): Promise<FfmpegRunResult> {
    assertFfmpegArgsAllowed(options.args);
    return this.limiter(() => runFfmpegProcess(options, this.spawnFn));
  }
}

/** 校验 FFmpeg 参数不在白名单时抛出。 */
export function assertFfmpegArgsAllowed(args: readonly string[]): void {
  for (const arg of args) {
    if (arg.startsWith("-")) {
      continue;
    }
    if (/^[A-Za-z0-9_./:\\-]+$/.test(arg)) {
      continue;
    }
    throw new Error(`Disallowed ffmpeg argument: ${arg}`);
  }
}

async function runFfmpegProcess(
  options: FfmpegRunOptions,
  spawnFn: SpawnFn,
): Promise<FfmpegRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawnFn(options.ffmpegPath, [...options.args]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`ffmpeg timed out after ${options.timeoutMs}ms`));
    }, options.timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}
