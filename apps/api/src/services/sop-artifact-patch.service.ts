import type { AuthContext, SopArtifactPatchBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { assertArtifactEditable } from "../domain/sop/assert-artifact-editable.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { PipelineArtifactRepository } from "../repositories/pipeline-artifact.repository.js";

function parseIfMatchVersion(ifMatch: string): number {
  const parsed = Number.parseInt(ifMatch, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid If-Match version");
  }
  return parsed;
}

export class SopArtifactPatchService {
  constructor(
    private readonly artifactRepository: PipelineArtifactRepository,
    private readonly pipelineRepository: CasePipelineRepository,
  ) {}

  async patch(
    actor: AuthContext,
    accessToken: string,
    artifactId: string,
    ifMatch: string,
    body: SopArtifactPatchBody,
  ) {
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
    assertArtifactEditable(artifact.status);
    const expectedVersion = parseIfMatchVersion(ifMatch);
    const updated = await this.artifactRepository.patchContentRaw(
      accessToken,
      artifact.id,
      expectedVersion,
      body.contentRaw,
      actor.userId,
    );
    if (!updated) {
      throw new AppHttpError(ErrorCode.RESOURCE_CONFLICT, "Artifact version conflict");
    }
    return updated;
  }
}
