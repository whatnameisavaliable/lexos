import {
  CasePipelineStatus,
  type CasePipelineStatus as CasePipelineStatusType,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";

/**
 * 断言流水线可执行 `execute` / `finalize`（`prd.md` §3.8.2）。
 * `completed` 与 `suspended` 禁止推进；挂起须先 `resume`。
 *
 * @throws {LexosError} `OPERATION_NOT_ALLOWED`
 */
export function assertPipelineActionable(
  status: CasePipelineStatusType,
): void {
  if (status === CasePipelineStatus.COMPLETED) {
    throw new LexosError(
      ErrorCode.OPERATION_NOT_ALLOWED,
      "Pipeline is completed and cannot accept step actions",
      { status },
    );
  }
  if (status === CasePipelineStatus.SUSPENDED) {
    throw new LexosError(
      ErrorCode.OPERATION_NOT_ALLOWED,
      "Pipeline is suspended; resume before executing or finalizing steps",
      { status },
    );
  }
}
