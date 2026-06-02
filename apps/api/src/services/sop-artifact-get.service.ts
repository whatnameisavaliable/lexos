import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { PipelineArtifactRepository } from "../repositories/pipeline-artifact.repository.js";

export class SopArtifactGetService {
  constructor(
    private readonly artifactRepository: PipelineArtifactRepository,
    private readonly pipelineRepository: CasePipelineRepository,
  ) {}

  async get(actor: AuthContext, accessToken: string, artifactId: string) {
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
    return artifact;
  }
}
