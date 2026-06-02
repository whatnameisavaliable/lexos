import type {
  AdminSopPreviewPipelineBody,
  AdminSopTemplateVersionDetail,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError, SopExecutionType, type SopPromptContext } from "@lexos/shared";
import type { AiFeatureKey } from "@lexos/shared";
import type { AdminSopRepository } from "../repositories/admin-sop.repository.js";
import type { AiPromptRepository } from "../repositories/ai-prompt.repository.js";
import type { SopAiOrchestrationService } from "./sop-ai-orchestration.service.js";

export interface AdminSopPreviewPipelineResult {
  readonly content: string;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly latencyMs: number;
}

const PREVIEW_PIPELINE_ID = "00000000-0000-4000-8000-000000000000";

/**
 * `POST /api/admin/sops/preview-pipeline` 沙盒试跑（不写 `case_pipelines`）。
 */
export class AdminSopPreviewPipelineService {
  constructor(
    private readonly adminSopRepository: AdminSopRepository,
    private readonly aiPromptRepository: AiPromptRepository,
    private readonly sopAiOrchestrationService: SopAiOrchestrationService,
  ) {}

  async preview(
    body: AdminSopPreviewPipelineBody,
  ): Promise<AdminSopPreviewPipelineResult> {
    const version = await this.adminSopRepository.findTemplateVersionById(
      body.templateVersionId,
    );
    if (!version) {
      throw new LexosError(
        ErrorCode.RESOURCE_NOT_FOUND,
        "SOP template version not found",
      );
    }

    const step = version.steps.find(
      (s: AdminSopTemplateVersionDetail["steps"][number]) =>
        s.stepCode === body.stepCode,
    );
    if (!step) {
      throw new LexosError(ErrorCode.RESOURCE_NOT_FOUND, "Step not found in version");
    }

    if (
      step.executionType !== SopExecutionType.SYNC_LLM &&
      step.executionType !== SopExecutionType.ASYNC_DEEP_RESEARCH
    ) {
      throw new LexosError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Preview is only supported for LLM-backed steps",
      );
    }

    if (!step.aiFeatureKey || !step.promptTemplateId) {
      throw new LexosError(
        ErrorCode.VALIDATION_FAILED,
        "Step requires aiFeatureKey and promptTemplateId for preview",
      );
    }

    const prompt = await this.aiPromptRepository.findById(step.promptTemplateId);
    if (!prompt) {
      throw new LexosError(ErrorCode.RESOURCE_NOT_FOUND, "Prompt template not found");
    }

    const promptContext: SopPromptContext = {
      finalizedArtifacts: body.finalizedArtifacts.map((a) => ({
        stepCode: a.stepCode,
        contentRaw: a.contentRaw,
      })),
      formValues: body.formValues,
      sopMediaExtractedText: body.sopMediaExtractedText,
    };

    const result = await this.sopAiOrchestrationService.invokeSopLlm({
      pipelineId: PREVIEW_PIPELINE_ID,
      stepCode: body.stepCode,
      featureKey: step.aiFeatureKey as AiFeatureKey,
      userPromptTemplate: prompt.system_prompt,
      promptContext,
    });

    return {
      content: result.content,
      modelId: result.modelId,
      isFallback: result.isFallback,
      latencyMs: result.latencyMs,
    };
  }
}
