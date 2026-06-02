import type {
  ArtifactContentType,
  AuthContext,
  SopAsyncExecuteAccepted,
  SopExecutionType,
  SopStepExecuteBody,
} from "@lexos/shared";
import { ArtifactContentType as ArtifactContentTypes, SopExecutionType as SopExecutionTypes } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import pg from "pg";
import { assertArtifactNotRunning } from "../domain/sop/assert-artifact-not-running.js";
import { assertDependsOnFinalized } from "../domain/sop/assert-depends-on-finalized.js";
import { assertPipelineActionable } from "../domain/sop/assert-pipeline-actionable.js";
import { buildSopDeepResearchOutboxPayload } from "../domain/sop/build-sop-deep-research-outbox-payload.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiPromptRepository } from "../repositories/ai-prompt.repository.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { OutboxRepository } from "../repositories/outbox.repository.js";
import type { PipelineArtifactRepository } from "../repositories/pipeline-artifact.repository.js";
import type { SopStepSnapshotRepository } from "../repositories/sop-step-snapshot.repository.js";
import { SopAiOrchestrationService } from "./sop-ai-orchestration.service.js";
import type { SopDeepResearchGuardService } from "./sop-deep-research-guard.service.js";

export interface SopStepExecuteResult {
  readonly statusCode: 200 | 202;
  readonly data: { readonly artifactId: string } | SopAsyncExecuteAccepted;
}

/**
 * `POST /api/sops/pipelines/:id/steps/:code/execute`
 */
export class SopStepExecuteService {
  private readonly pool: pg.Pool;

  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly casePipelineRepository: CasePipelineRepository,
    private readonly stepSnapshotRepository: SopStepSnapshotRepository,
    private readonly artifactRepository: PipelineArtifactRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly deepResearchGuardService: SopDeepResearchGuardService,
    private readonly aiPromptRepository: AiPromptRepository,
    private readonly orchestrationService: SopAiOrchestrationService,
  ) {
    this.pool = new pg.Pool({ connectionString: supabaseEnv.supabaseDbUrl, max: 10 });
  }

  async execute(
    actor: AuthContext,
    accessToken: string,
    pipelineId: string,
    stepCode: string,
    body: SopStepExecuteBody,
  ): Promise<SopStepExecuteResult> {
    const pipeline = await this.casePipelineRepository.findPipelineForLawyer(accessToken, pipelineId);
    if (!pipeline || pipeline.lawyerId !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Pipeline access denied");
    }
    assertPipelineActionable(pipeline.status);

    const steps = await this.stepSnapshotRepository.listStepsByTemplateVersionId(
      accessToken,
      pipeline.templateVersionId,
    );
    const step = steps.find((item) => item.stepCode === stepCode);
    if (!step) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Step not found");
    }

    const depArtifactsByCode: Record<string, { status: string; contentRaw?: string } | undefined> =
      {};
    for (const dep of step.dependsOn) {
      const artifact = await this.artifactRepository.findArtifactByStep(accessToken, pipeline.id, dep);
      depArtifactsByCode[dep] = artifact ? { status: artifact.status, contentRaw: artifact.contentRaw } : undefined;
    }
    assertDependsOnFinalized(pipeline.id, { stepCode, dependsOn: step.dependsOn }, depArtifactsByCode);

    const existingArtifact = await this.artifactRepository.findArtifactByStep(accessToken, pipeline.id, stepCode);
    assertArtifactNotRunning(existingArtifact?.status);

    let result: SopStepExecuteResult;
    if (step.executionType === SopExecutionTypes.MANUAL) {
      result = await this.executeManualStep(accessToken, pipeline.id, stepCode, actor.userId, body.formValues);
    } else if (step.executionType === SopExecutionTypes.SYNC_LLM) {
      result = await this.executeSyncLlmStep(
        accessToken,
        pipeline.id,
        step,
        actor.userId,
        body.formValues,
        depArtifactsByCode,
      );
    } else {
      result = await this.executeAsyncDeepResearchStep(accessToken, pipeline.id, stepCode, actor.userId);
    }

    await this.updateCurrentStepCodeAfterExecute(accessToken, pipeline.id, stepCode);
    return result;
  }

  private async executeManualStep(
    accessToken: string,
    pipelineId: string,
    stepCode: string,
    updatedBy: string,
    formValues: Readonly<Record<string, unknown>>,
  ): Promise<SopStepExecuteResult> {
    const artifact = await this.artifactRepository.upsertArtifactForStep(accessToken, {
      pipelineId,
      stepCode,
      contentType: ArtifactContentTypes.JSON as ArtifactContentType,
      status: "draft",
      contentRaw: JSON.stringify(formValues),
      updatedBy,
    });
    return { statusCode: 200, data: { artifactId: artifact.id } };
  }

  private async executeSyncLlmStep(
    accessToken: string,
    pipelineId: string,
    step: {
      stepCode: string;
      aiFeatureKey: string | null;
      promptTemplateId: string | null;
      executionType: SopExecutionType;
    },
    updatedBy: string,
    formValues: Readonly<Record<string, unknown>>,
    artifactsByCode: Record<string, { status: string; contentRaw?: string } | undefined>,
  ): Promise<SopStepExecuteResult> {
    if (!step.aiFeatureKey || !step.promptTemplateId) {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "LLM step requires aiFeatureKey and promptTemplateId",
      );
    }
    const prompt = await this.aiPromptRepository.findById(step.promptTemplateId);
    if (!prompt) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Prompt template not found");
    }
    try {
      const llm = await this.orchestrationService.invokeSopLlm({
        pipelineId,
        stepCode: step.stepCode,
        featureKey: step.aiFeatureKey,
        userPromptTemplate: prompt.system_prompt,
        promptContext: {
          finalizedArtifacts: Object.entries(artifactsByCode)
            .filter(([, v]) => v?.status === "finalized")
            .map(([depStepCode, v]) => ({ stepCode: depStepCode, contentRaw: v?.contentRaw ?? "" })),
          formValues,
          sopMediaExtractedText: "",
        },
      });
      const artifact = await this.artifactRepository.upsertArtifactForStep(accessToken, {
        pipelineId,
        stepCode: step.stepCode,
        contentType: ArtifactContentTypes.MARKDOWN as ArtifactContentType,
        status: "draft",
        contentRaw: llm.content,
        updatedBy,
      });
      return { statusCode: 200, data: { artifactId: artifact.id } };
    } catch {
      const artifact = await this.artifactRepository.upsertArtifactForStep(accessToken, {
        pipelineId,
        stepCode: step.stepCode,
        contentType: ArtifactContentTypes.MARKDOWN as ArtifactContentType,
        status: "failed",
        updatedBy,
      });
      return { statusCode: 200, data: { artifactId: artifact.id } };
    }
  }

  private async executeAsyncDeepResearchStep(
    accessToken: string,
    pipelineId: string,
    stepCode: string,
    updatedBy: string,
  ): Promise<SopStepExecuteResult> {
    await this.deepResearchGuardService.assertDeepResearchEnabled();

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const upsert = await client.query<{ id: string }>(
        `INSERT INTO public.pipeline_artifacts (
           pipeline_id, step_code, content_type, content_raw, status, updated_by
         ) VALUES ($1::uuid, $2, 'markdown', '', 'running', $3::uuid)
         ON CONFLICT (pipeline_id, step_code)
         DO UPDATE SET status='running', updated_by=$3::uuid, updated_at=now()
         RETURNING id`,
        [pipelineId, stepCode, updatedBy],
      );
      const artifactId = upsert.rows[0]?.id;
      if (!artifactId) {
        throw new AppHttpError(ErrorCode.INTERNAL_ERROR, "Failed to create running artifact");
      }
      const outboxPayload = buildSopDeepResearchOutboxPayload({
        pipelineId,
        stepCode,
        artifactId,
      });
      await this.outboxRepository.insertSopOutboxInTransaction(client, {
        pipelineId,
        stage: outboxPayload.stage,
        stepCode: outboxPayload.step_code,
        artifactId: outboxPayload.artifact_id,
      });
      await client.query("COMMIT");
      return {
        statusCode: 202,
        data: { pipelineId, stepCode, artifactId },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async updateCurrentStepCodeAfterExecute(
    accessToken: string,
    pipelineId: string,
    stepCode: string,
  ): Promise<void> {
    await this.casePipelineRepository.updateCurrentStepCode(accessToken, pipelineId, stepCode);
  }
}
