/** ASR 队列路由相关环境变量（`architecture.md` §3.2.1.2）。 */
export interface AsrRuntimeEnvConfig {
  /** Express 队列时长上限（秒）；默认 1800。 */
  readonly asrExpressMaxDurationSec: number;
}

const DEFAULT_ASR_EXPRESS_MAX_DURATION_SEC = 1800;

/**
 * 从 `process.env` 加载 ASR 运行时配置。
 */
export function loadAsrRuntimeEnvFromProcess(): AsrRuntimeEnvConfig {
  const raw = process.env.ASR_EXPRESS_MAX_DURATION_SEC?.trim();
  if (!raw) {
    return { asrExpressMaxDurationSec: DEFAULT_ASR_EXPRESS_MAX_DURATION_SEC };
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("ASR_EXPRESS_MAX_DURATION_SEC must be a positive integer");
  }
  return { asrExpressMaxDurationSec: parsed };
}

/**
 * 校验 ASR 相关必填项（与 Worker 共用时可扩展）。
 */
export function assertAsrRuntimeEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (!env.ASR_EXPRESS_MAX_DURATION_SEC?.trim()) {
    return;
  }
  loadAsrRuntimeEnvFromProcess();
}
