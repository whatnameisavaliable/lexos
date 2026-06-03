import {
  AiFeatureKey,
  renderMustacheTemplate,
  stepCodeToMustacheArtifactPrefix,
  type SopOutboxPayload,
} from "@lexos/shared";
import type { SopWorkerRuntimeEnvConfig } from "@lexos/shared/config";
import type { Pool, PoolClient } from "pg";
import { isExternalSearchAvailable } from "../domain/sop/is-external-search-available.js";
import { withPgClient } from "../infra/with-pg-client.js";
import type { WorkerCasePipelineRepository } from "../repositories/worker-case-pipeline.repository.js";
import type { WorkerPipelineArtifactRepository } from "../repositories/worker-pipeline-artifact.repository.js";
import type { WorkerSopPromptRepository } from "../repositories/worker-sop-prompt.repository.js";
import type { WorkerSystemSettingsRepository } from "../repositories/worker-system-settings.repository.js";
import { WorkerAiRepository } from "../repositories/worker-ai.repository.js";
import type { SopLlmOrchestrationService } from "./sop-llm-orchestration.service.js";

/** Deep Research 被运维关闭时的静默退出标记。 */
export class SopDeepResearchDisabledError extends Error {
  constructor() {
    super("SOP deep research disabled by system_settings");
    this.name = "SopDeepResearchDisabledError";
  }
}

/**
 * `sop.deep_research` 阶段：可选外网检索 + LLM → `pipeline_artifacts` draft/failed。
 */
export class SopDeepResearchService {
  constructor(
    private readonly env: Pick<
      SopWorkerRuntimeEnvConfig,
      "sopDeepResearchTimeoutMs"
    >,
    private readonly pipelineRepository: WorkerCasePipelineRepository,
    private readonly artifactRepository: WorkerPipelineArtifactRepository,
    private readonly settingsRepository: WorkerSystemSettingsRepository,
    private readonly promptRepository: WorkerSopPromptRepository,
    private readonly llmOrchestration: SopLlmOrchestrationService,
    private readonly externalSearchProbe: typeof isExternalSearchAvailable = isExternalSearchAvailable,
  ) {}

  async run(pool: Pool, payload: SopOutboxPayload): Promise<void> {
    if (!payload.artifact_id) {
      throw new Error("sop.deep_research requires artifact_id");
    }

    const disabled = await withPgClient(pool, async (client) => {
      await this.pipelineRepository.assertLawyerPipelineWritable(
        client,
        payload.pipeline_id,
      );
      return !(await this.assertDeepResearchEnabled(client));
    });
    if (disabled) {
      await withPgClient(pool, (client) =>
        this.writeFailedArtifact(client, payload.artifact_id!, "Deep research disabled"),
      );
      return;
    }

    try {
      await this.runWithTimeout(
        this.executeDeepResearch(pool, payload),
        this.env.sopDeepResearchTimeoutMs,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Deep research failed";
      await withPgClient(pool, (client) =>
        this.writeFailedArtifact(client, payload.artifact_id!, message),
      );
      throw error;
    }
  }

  /** 读取系统开关；`false` 时 Worker 防御性失败 artifact。 */
  async assertDeepResearchEnabled(client: PoolClient): Promise<boolean> {
    return this.settingsRepository.isDeepResearchEnabled(client);
  }

  /** 包装 Promise 超时（`SOP_DEEP_RESEARCH_TIMEOUT_MS`）。 */
  async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const guarded = promise.finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    return Promise.race([
      guarded,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("SOP deep research timed out")),
          timeoutMs,
        );
      }),
    ]);
  }

  /** 外网 Search/Tool 不可达时降级 LLM-only。 */
  async runExternalSearchOrSkip(): Promise<boolean> {
    return this.externalSearchProbe();
  }

  async writeDraftArtifact(
    client: PoolClient,
    artifactId: string,
    markdown: string,
  ): Promise<void> {
    await this.artifactRepository.setContentRaw(client, artifactId, markdown);
    await this.artifactRepository.setArtifactStatus(client, artifactId, "draft");
  }

  async writeFailedArtifact(
    client: PoolClient,
    artifactId: string,
    _reason: string,
  ): Promise<void> {
    await this.artifactRepository.setArtifactStatus(client, artifactId, "failed");
  }

  private async executeDeepResearch(
    pool: Pool,
    payload: SopOutboxPayload,
  ): Promise<void> {
    const externalSearch = await this.runExternalSearchOrSkip();
    const userPrompt = await withPgClient(pool, (client) =>
      this.buildUserPrompt(client, payload, externalSearch),
    );

    const idempotencyKey = WorkerAiRepository.buildIdempotencyKey([
      "sop.deep_research",
      payload.pipeline_id,
      payload.step_code,
      payload.artifact_id!,
    ]);

    const llm = await this.llmOrchestration.invoke({
      pool,
      pipelineId: payload.pipeline_id,
      stepCode: payload.step_code,
      featureKey: AiFeatureKey.SOP_DEEP_RESEARCH,
      llmUserPrompt: userPrompt,
      idempotencyKey,
    });

    await withPgClient(pool, (client) =>
      this.writeDraftArtifact(client, payload.artifact_id!, llm.text),
    );
  }

  private async buildUserPrompt(
    client: PoolClient,
    payload: SopOutboxPayload,
    externalSearchAvailable: boolean,
  ): Promise<string> {
    const pipeline = await this.pipelineRepository.findPipelineWithLawyer(
      client,
      payload.pipeline_id,
    );
    if (!pipeline) {
      throw new Error(`case_pipelines not found: ${payload.pipeline_id}`);
    }

    const step = await this.promptRepository.findStepByTemplateVersion(
      client,
      pipeline.templateVersionId,
      payload.step_code,
    );
    if (!step?.promptTemplateId) {
      throw new Error("Deep research step missing prompt_template_id");
    }

    const template = await this.promptRepository.findPromptSystemTemplate(
      client,
      step.promptTemplateId,
    );
    if (!template) {
      throw new Error("Prompt template not found for deep research step");
    }

    const finalized = await this.promptRepository.loadFinalizedArtifactContents(
      client,
      payload.pipeline_id,
      step.dependsOn,
    );
    const mediaText = await this.artifactRepository.loadMediaExtractedText(
      client,
      payload.pipeline_id,
    );

    const context: Record<string, string> = {
      sop_media_extracted_text: mediaText,
    };
    for (const [depStepCode, content] of Object.entries(finalized)) {
      context[`${stepCodeToMustacheArtifactPrefix(depStepCode)}fact`] =
        content.slice(0, 4000);
    }
    if (!externalSearchAvailable) {
      context.sop_external_search_note =
        "外网检索不可用，仅基于 LLM 内部知识推理。";
    }

    return renderMustacheTemplate(template, context);
  }
}
