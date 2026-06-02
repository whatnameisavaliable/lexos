import type { AuthContext } from "@lexos/shared";
import { PipelineArtifactStatus } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import pg from "pg";
import { buildSopPdfExportOutboxPayload } from "../domain/sop/build-sop-pdf-export-outbox-payload.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { OutboxRepository } from "../repositories/outbox.repository.js";
import type { PipelineArtifactRepository } from "../repositories/pipeline-artifact.repository.js";

export class SopArtifactRegeneratePdfService {
  private readonly pool: pg.Pool;

  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly artifactRepository: PipelineArtifactRepository,
    private readonly pipelineRepository: CasePipelineRepository,
    private readonly outboxRepository: OutboxRepository,
  ) {
    this.pool = new pg.Pool({ connectionString: supabaseEnv.supabaseDbUrl, max: 10 });
  }

  async regenerate(actor: AuthContext, accessToken: string, artifactId: string) {
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
    if (artifact.status !== PipelineArtifactStatus.FINALIZED) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Only finalized artifact can regenerate PDF",
      );
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const payload = buildSopPdfExportOutboxPayload({
        pipelineId: artifact.pipelineId,
        stepCode: artifact.stepCode,
        artifactId: artifact.id,
      });
      await this.outboxRepository.insertSopOutboxInTransaction(client, {
        pipelineId: payload.pipeline_id,
        stage: payload.stage,
        stepCode: payload.step_code,
        artifactId: payload.artifact_id,
      });
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return { artifactId: artifact.id, status: "queued" as const };
  }
}
