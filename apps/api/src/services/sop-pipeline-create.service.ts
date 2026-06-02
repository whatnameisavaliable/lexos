import type { AuthContext, SopPipelineCreateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { findDagEntryStepCode } from "../domain/sop/find-dag-entry-step-code.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { SopStepSnapshotRepository } from "../repositories/sop-step-snapshot.repository.js";
import type { SopTemplateReadRepository } from "../repositories/sop-template-read.repository.js";

export class SopPipelineCreateService {
  constructor(
    private readonly templateReadRepository: SopTemplateReadRepository,
    private readonly stepSnapshotRepository: SopStepSnapshotRepository,
    private readonly casePipelineRepository: CasePipelineRepository,
  ) {}

  async create(
    actor: AuthContext,
    accessToken: string,
    body: SopPipelineCreateBody,
  ) {
    const isPublished = await this.templateVersionPublished(
      accessToken,
      body.templateVersionId,
    );
    if (!isPublished) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Template version is not published",
      );
    }

    const steps = await this.stepSnapshotRepository.listStepsByTemplateVersionId(
      accessToken,
      body.templateVersionId,
    );
    if (steps.length === 0) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Template steps not found");
    }
    const entryStepCode = findDagEntryStepCode(
      steps.map((step) => ({ stepCode: step.stepCode, dependsOn: step.dependsOn })),
    );

    return this.casePipelineRepository.createPipeline(
      accessToken,
      body.templateVersionId,
      actor.userId,
      entryStepCode,
    );
  }

  private async templateVersionPublished(
    accessToken: string,
    templateVersionId: string,
  ): Promise<boolean> {
    let cursor: string | undefined;
    do {
      const page = await this.templateReadRepository.listPublishedTemplates(accessToken, {
        limit: 50,
        cursor,
      });
      if (page.items.some((item) => item.templateVersionId === templateVersionId)) {
        return true;
      }
      cursor = page.nextCursor;
    } while (cursor);
    return false;
  }
}
