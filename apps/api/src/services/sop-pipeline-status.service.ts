import type {
  AuthContext,
  SopPipelineStatusResponse,
  SopPipelineStepStatusItem,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { PipelineArtifactRepository } from "../repositories/pipeline-artifact.repository.js";
import type { SopStepSnapshotRepository } from "../repositories/sop-step-snapshot.repository.js";

export class SopPipelineStatusService {
  constructor(
    private readonly casePipelineRepository: CasePipelineRepository,
    private readonly stepSnapshotRepository: SopStepSnapshotRepository,
    private readonly artifactRepository: PipelineArtifactRepository,
  ) {}

  async getStatus(
    _actor: AuthContext,
    accessToken: string,
    pipelineId: string,
  ): Promise<SopPipelineStatusResponse> {
    const pipeline = await this.casePipelineRepository.findPipelineForLawyer(
      accessToken,
      pipelineId,
    );
    if (!pipeline) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Pipeline access denied");
    }

    const steps = await this.stepSnapshotRepository.listStepsByTemplateVersionId(
      accessToken,
      pipeline.templateVersionId,
    );
    const resultSteps: SopPipelineStepStatusItem[] = [];
    for (const step of steps) {
      const artifact = await this.artifactRepository.findArtifactByStep(
        accessToken,
        pipeline.id,
        step.stepCode,
      );
      resultSteps.push({
        stepCode: step.stepCode,
        artifactStatus: artifact?.status ?? null,
      });
    }

    return {
      pipelineId: pipeline.id,
      status: pipeline.status,
      currentStepCode: pipeline.currentStepCode,
      steps: resultSteps,
    };
  }
}
