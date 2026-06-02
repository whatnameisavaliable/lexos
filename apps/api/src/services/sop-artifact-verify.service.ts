import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { PipelineArtifactRepository } from "../repositories/pipeline-artifact.repository.js";
import type { AuditWriterService } from "./audit-writer.service.js";

export class SopArtifactVerifyService {
  constructor(
    private readonly artifactRepository: PipelineArtifactRepository,
    private readonly pipelineRepository: CasePipelineRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  async verify(actor: AuthContext, accessToken: string, artifactId: string) {
    const artifact = await this.artifactRepository.findArtifactById(accessToken, artifactId);
    if (!artifact) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Artifact not found");
    }
    const pipeline = await this.pipelineRepository.findPipelineForLawyer(
      accessToken,
      artifact.pipelineId,
    );
    if (!pipeline || pipeline.lawyerId !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Artifact access denied");
    }
    await this.auditWriterService.write({
      actorId: actor.userId,
      action: "sop.artifact.verify",
      targetType: "pipeline_artifact",
      targetId: artifact.id,
      metadata: {
        artifact_id: artifact.id,
        pipeline_id: pipeline.id,
        step_code: artifact.stepCode,
      },
    });
    return { artifactId: artifact.id, verified: true as const };
  }
}
