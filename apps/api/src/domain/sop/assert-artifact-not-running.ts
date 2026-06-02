import {
  PipelineArtifactStatus,
  type PipelineArtifactStatus as PipelineArtifactStatusType,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";

/**
 * 拒绝在产出物 `running` 时重复 `execute`（`prd.md` §3.8.3）。
 *
 * @throws {LexosError} `OPERATION_NOT_ALLOWED`
 */
export function assertArtifactNotRunning(
  status: PipelineArtifactStatusType | null | undefined,
): void {
  if (status === PipelineArtifactStatus.RUNNING) {
    throw new LexosError(
      ErrorCode.OPERATION_NOT_ALLOWED,
      "Step is already running; wait for completion before re-executing",
      { status },
    );
  }
}
