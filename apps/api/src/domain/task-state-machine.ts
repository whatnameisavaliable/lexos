import { ErrorCode } from "@lexos/shared/api";
import type { TranscriptionTaskStatus } from "@lexos/shared";

/** 合法状态迁移表（`prd.md` §3.5 · `architecture.md` §3.3）。 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<TranscriptionTaskStatus, readonly TranscriptionTaskStatus[]>
> = {
  uploading: ["queued", "failed"],
  queued: ["extracting", "preprocessing", "failed"],
  extracting: ["preprocessing", "failed"],
  preprocessing: ["asr_running", "failed"],
  asr_running: ["llm_running", "failed"],
  llm_running: ["completed", "failed"],
  completed: ["llm_running"],
  failed: ["queued", "asr_running", "llm_running"],
};

/**
 * 业务错误：非法状态迁移。
 */
export class TaskInvalidStateError extends Error {
  readonly code = ErrorCode.TASK_INVALID_STATE;

  constructor(
    readonly from: TranscriptionTaskStatus,
    readonly to: TranscriptionTaskStatus,
  ) {
    super(`Invalid task status transition: ${from} -> ${to}`);
    this.name = "TaskInvalidStateError";
  }
}

/**
 * 判断 `from → to` 是否为合法迁移。
 */
export function canTransitionTaskStatus(
  from: TranscriptionTaskStatus,
  to: TranscriptionTaskStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * 断言状态迁移合法；非法时抛出 {@link TaskInvalidStateError}。
 */
export function assertTaskStatusTransition(
  from: TranscriptionTaskStatus,
  to: TranscriptionTaskStatus,
): void {
  if (!canTransitionTaskStatus(from, to)) {
    throw new TaskInvalidStateError(from, to);
  }
}
