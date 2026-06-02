import { CasePipelineStatus, type AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";

export class SopPipelineResumeService {
  constructor(private readonly casePipelineRepository: CasePipelineRepository) {}

  async resume(actor: AuthContext, accessToken: string, pipelineId: string) {
    const pipeline = await this.casePipelineRepository.findPipelineForLawyer(
      accessToken,
      pipelineId,
    );
    if (!pipeline || pipeline.lawyerId !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Pipeline access denied");
    }
    if (pipeline.status !== CasePipelineStatus.SUSPENDED) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Only suspended pipelines can be resumed",
      );
    }
    const updated = await this.casePipelineRepository.updatePipelineStatus(
      accessToken,
      pipelineId,
      CasePipelineStatus.IN_PROGRESS,
    );
    if (!updated) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Pipeline not found");
    }
    return updated;
  }
}
