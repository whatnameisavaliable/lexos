import type { PoolClient } from "pg";

/** SOP 步骤快照（Worker 读取子集）。 */
export interface WorkerSopStepSnapshot {
  readonly stepCode: string;
  readonly promptTemplateId: string | null;
  readonly dependsOn: readonly string[];
}

/**
 * Worker 侧 SOP Prompt 上下文加载（`service_role` · 步骤模板快照）。
 */
export class WorkerSopPromptRepository {
  /** 按模板版本与步骤 code 读取步骤定义。 */
  async findStepByTemplateVersion(
    client: PoolClient,
    templateVersionId: string,
    stepCode: string,
  ): Promise<WorkerSopStepSnapshot | null> {
    const result = await client.query<{
      step_code: string;
      prompt_template_id: string | null;
      depends_on: unknown;
    }>(
      `SELECT step_code, prompt_template_id, depends_on
       FROM public.sop_steps
       WHERE template_version_id = $1::uuid
         AND step_code = $2`,
      [templateVersionId, stepCode],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      stepCode: row.step_code,
      promptTemplateId: row.prompt_template_id,
      dependsOn: parseDependsOn(row.depends_on),
    };
  }

  /** 读取 Prompt 模板 system_prompt 正文。 */
  async findPromptSystemTemplate(
    client: PoolClient,
    promptTemplateId: string,
  ): Promise<string | null> {
    const result = await client.query<{ system_prompt: string }>(
      `SELECT system_prompt
       FROM public.ai_prompt_templates
       WHERE id = $1::uuid`,
      [promptTemplateId],
    );
    return result.rows[0]?.system_prompt ?? null;
  }

  /** 读取已定稿上游产出物正文（按 step_code）。 */
  async loadFinalizedArtifactContents(
    client: PoolClient,
    pipelineId: string,
    stepCodes: readonly string[],
  ): Promise<Readonly<Record<string, string>>> {
    if (stepCodes.length === 0) {
      return {};
    }
    const result = await client.query<{
      step_code: string;
      content_raw: string;
    }>(
      `SELECT step_code, content_raw
       FROM public.pipeline_artifacts
       WHERE pipeline_id = $1::uuid
         AND step_code = ANY($2::text[])
         AND status = 'finalized'`,
      [pipelineId, stepCodes],
    );
    const map: Record<string, string> = {};
    for (const row of result.rows) {
      map[row.step_code] = row.content_raw;
    }
    return map;
  }
}

function parseDependsOn(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}
