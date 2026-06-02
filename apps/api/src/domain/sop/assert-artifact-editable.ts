import {
  PipelineArtifactStatus,
  type PipelineArtifactStatus as PipelineArtifactStatusType,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";

/**
 * 断言产出物可 PATCH `content_raw`（`finalized` 禁止编辑 · `prd.md` §3.9.3）。
 *
 * @throws {LexosError} `OPERATION_NOT_ALLOWED`
 */
export function assertArtifactEditable(
  status: PipelineArtifactStatusType,
): void {
  if (status === PipelineArtifactStatus.FINALIZED) {
    throw new LexosError(
      ErrorCode.OPERATION_NOT_ALLOWED,
      "Finalized artifacts cannot be edited",
      { status },
    );
  }
}
