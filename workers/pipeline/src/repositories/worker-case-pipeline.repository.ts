import type { PoolClient } from "pg";
import type { CasePipelineStatus } from "@lexos/shared";

/** 案件流水线行（Worker 读取子集，含律师 profile 状态）。 */
export interface WorkerCasePipelineRecord {
  readonly id: string;
  readonly lawyerId: string;
  readonly lawyerStatus: string | null;
  readonly templateVersionId: string;
  readonly status: CasePipelineStatus;
  readonly currentStepCode: string | null;
}

interface WorkerCasePipelineRowDb {
  readonly id: string;
  readonly lawyer_id: string;
  readonly lawyer_status: string | null;
  readonly template_version_id: string;
  readonly status: CasePipelineStatus;
  readonly current_step_code: string | null;
}

const PIPELINE_WITH_LAWYER_SELECT = `
  SELECT cp.id,
         cp.lawyer_id,
         p.status AS lawyer_status,
         cp.template_version_id,
         cp.status,
         cp.current_step_code
  FROM public.case_pipelines cp
  LEFT JOIN public.profiles p ON p.id = cp.lawyer_id`;

/**
 * Worker 侧案件流水线读写（`service_role` 连接上下文）。
 */
export class WorkerCasePipelineRepository {
  /**
   * 校验流水线存在且负责律师 profile 为 `enabled`（RLS 等价校验；`architecture.md` §5.6.2）。
   */
  async assertLawyerPipelineWritable(
    client: PoolClient,
    pipelineId: string,
  ): Promise<void> {
    const pipeline = await this.findPipelineWithLawyer(client, pipelineId);
    if (!pipeline) {
      throw new Error(`case_pipelines not found: ${pipelineId}`);
    }
    if (!pipeline.lawyerStatus) {
      throw new Error(
        `lawyer profile missing or deleted for pipeline ${pipelineId}`,
      );
    }
    if (pipeline.lawyerStatus !== "enabled") {
      throw new Error(
        `lawyer profile not enabled for pipeline ${pipelineId}: ${pipeline.lawyerStatus}`,
      );
    }
  }

  /** 按 ID 查询流水线并联接律师 profile 状态。 */
  async findPipelineWithLawyer(
    client: PoolClient,
    pipelineId: string,
  ): Promise<WorkerCasePipelineRecord | null> {
    const result = await client.query<WorkerCasePipelineRowDb>(
      `${PIPELINE_WITH_LAWYER_SELECT}
       WHERE cp.id = $1::uuid`,
      [pipelineId],
    );
    const row = result.rows[0];
    return row ? mapWorkerCasePipelineRow(row) : null;
  }

  /** 更新流水线当前步骤游标。 */
  async updateCurrentStepCode(
    client: PoolClient,
    pipelineId: string,
    stepCode: string,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.case_pipelines
       SET current_step_code = $2
       WHERE id = $1::uuid`,
      [pipelineId, stepCode],
    );
    if (result.rowCount !== 1) {
      throw new Error("case_pipelines.updateCurrentStepCode failed");
    }
  }
}

function mapWorkerCasePipelineRow(
  row: WorkerCasePipelineRowDb,
): WorkerCasePipelineRecord {
  return {
    id: row.id,
    lawyerId: row.lawyer_id,
    lawyerStatus: row.lawyer_status,
    templateVersionId: row.template_version_id,
    status: row.status,
    currentStepCode: row.current_step_code,
  };
}
