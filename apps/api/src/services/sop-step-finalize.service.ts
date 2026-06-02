import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import pg from "pg";
import { assertPipelineActionable } from "../domain/sop/assert-pipeline-actionable.js";
import { buildSopPdfExportOutboxPayload } from "../domain/sop/build-sop-pdf-export-outbox-payload.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { OutboxRepository } from "../repositories/outbox.repository.js";
import type { PipelineArtifactRepository } from "../repositories/pipeline-artifact.repository.js";
import type { SopStepSnapshotRepository } from "../repositories/sop-step-snapshot.repository.js";
import type { SopVerifiedRepository } from "../repositories/sop-verified.repository.js";

export class SopStepFinalizeService {
  private readonly pool: pg.Pool;

  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly pipelineRepository: CasePipelineRepository,
    private readonly stepSnapshotRepository: SopStepSnapshotRepository,
    private readonly artifactRepository: PipelineArtifactRepository,
    private readonly verifiedRepository: SopVerifiedRepository,
    private readonly outboxRepository: OutboxRepository,
  ) {
    this.pool = new pg.Pool({ connectionString: supabaseEnv.supabaseDbUrl, max: 10 });
  }

  async finalize(
    actor: AuthContext,
    accessToken: string,
    pipelineId: string,
    stepCode: string,
  ) {
    const pipeline = await this.pipelineRepository.findPipelineForLawyer(accessToken, pipelineId);
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
    const artifact = await this.artifactRepository.findArtifactByStep(accessToken, pipelineId, stepCode);
    if (!artifact) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Artifact not found");
    }

    await this.assertVerifiedIfRequired(step.requiresVerification, pipelineId, stepCode, artifact.id);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query<{
        id: string;
        content_type: string;
      }>(
        `UPDATE public.pipeline_artifacts
         SET status='finalized',
             finalized_snapshot_raw=content_raw,
             updated_by=$2::uuid,
             updated_at=now()
         WHERE id=$1::uuid
         RETURNING id, content_type`,
        [artifact.id, actor.userId],
      );
      const row = updated.rows[0];
      if (!row) {
        throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Artifact not found");
      }
      if (row.content_type === "html") {
        const payload = buildSopPdfExportOutboxPayload({
          pipelineId,
          stepCode,
          artifactId: artifact.id,
        });
        await this.outboxRepository.insertSopOutboxInTransaction(client, {
          pipelineId,
          stage: payload.stage,
          stepCode: payload.step_code,
          artifactId: payload.artifact_id,
        });
      }
      await client.query("COMMIT");
      return { artifactId: artifact.id, status: "finalized" as const };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async assertVerifiedIfRequired(
    requiresVerification: boolean,
    pipelineId: string,
    stepCode: string,
    artifactId: string,
  ): Promise<void> {
    if (!requiresVerification) {
      return;
    }
    const auto = await this.verifiedRepository.hasAutoVerification(pipelineId, stepCode);
    const manual = await this.verifiedRepository.hasManualVerification(artifactId);
    if (!auto && !manual) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Artifact requires verification before finalize",
      );
    }
  }
}
