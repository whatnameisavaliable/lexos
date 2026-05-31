/**
 * U3 Pipeline Worker 健康报告（`architecture.md` §4.4.1）。
 *
 * 聚合 FFmpeg 版本探测；可在启动日志或独立 HTTP 探针中调用。
 */
import {
  checkFfmpegHealth,
  type FfmpegHealthCheckResult,
} from "./ffmpeg-healthcheck.js";

/** Worker 子系统健康状态。 */
export interface WorkerHealthReport {
  readonly status: "ok" | "unhealthy";
  readonly checks: {
    readonly ffmpeg: FfmpegHealthCheckResult & {
      readonly path: string;
    };
  };
}

/**
 * 执行 Worker 节点健康探测。
 *
 * @param ffmpegPath - `FFMPEG_PATH` 环境变量值
 */
export async function runWorkerHealthCheck(
  ffmpegPath: string,
): Promise<WorkerHealthReport> {
  const ffmpeg = await checkFfmpegHealth(ffmpegPath);
  return {
    status: ffmpeg.ok ? "ok" : "unhealthy",
    checks: {
      ffmpeg: { ...ffmpeg, path: ffmpegPath },
    },
  };
}

/**
 * 格式化 Worker 健康报告为启动日志行。
 *
 * @param report - {@link runWorkerHealthCheck} 返回值
 */
export function formatWorkerHealthLogLine(report: WorkerHealthReport): string {
  const version = report.checks.ffmpeg.versionLine ?? "unknown";
  const path = report.checks.ffmpeg.path;
  if (report.status === "ok") {
    return `[pipeline-worker] health ok ffmpeg=${path} version=${version}`;
  }
  return `[pipeline-worker] health unhealthy ffmpeg=${path} error=${report.checks.ffmpeg.errorMessage ?? "unknown"}`;
}
