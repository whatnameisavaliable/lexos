import type {
  AdminSopStepUpsert,
  AdminSopTemplateCreateBody,
  AdminSopTemplateListItem,
  AdminSopTemplateVersionDetail,
  AdminSopTemplateVersionSummary,
  SopExecutionType,
  SopAiFeatureKey,
} from "@lexos/shared";

/** DB `sop_templates` 行。 */
export interface SopTemplateRowDb {
  readonly id: string;
  readonly name: string;
  readonly case_type: string;
  readonly created_by: string;
  readonly created_at: string;
}

/** DB `sop_template_versions` 行。 */
export interface SopTemplateVersionRowDb {
  readonly id: string;
  readonly template_id: string;
  readonly version_number: number;
  readonly is_published: boolean;
  readonly published_at: string | null;
  readonly created_by: string;
  readonly created_at: string;
}

/** DB `sop_steps` 行。 */
export interface SopStepRowDb {
  readonly id: string;
  readonly template_version_id: string;
  readonly step_code: string;
  readonly name: string;
  readonly execution_type: SopExecutionType;
  readonly ai_feature_key: SopAiFeatureKey | null;
  readonly prompt_template_id: string | null;
  readonly input_schema: Record<string, unknown>;
  readonly depends_on: string[];
  readonly requires_verification: boolean;
  readonly created_at: string;
}

/** 模板 + 版本联结查询行。 */
export interface SopTemplateVersionJoinRowDb extends SopTemplateRowDb {
  readonly sop_template_versions: SopTemplateVersionRowDb[] | SopTemplateVersionRowDb | null;
}

/** 列表查询结果。 */
export interface AdminSopListResult {
  readonly items: readonly AdminSopTemplateListItem[];
  readonly nextCursor?: string;
}

/** 模板详情（含全部版本摘要）。 */
export interface AdminSopTemplateDetail {
  readonly templateId: string;
  readonly name: string;
  readonly caseType: string;
  readonly createdAt: string;
  readonly versions: readonly AdminSopTemplateVersionSummary[];
}

export function mapSopStepRow(row: SopStepRowDb) {
  return {
    id: row.id,
    stepCode: row.step_code,
    name: row.name,
    executionType: row.execution_type,
    aiFeatureKey: row.ai_feature_key,
    promptTemplateId: row.prompt_template_id,
    inputSchema: row.input_schema ?? {},
    dependsOn: Array.isArray(row.depends_on) ? row.depends_on : [],
    requiresVerification: row.requires_verification,
    createdAt: row.created_at,
  };
}

export function mapVersionDetail(
  version: SopTemplateVersionRowDb,
  template: SopTemplateRowDb,
  steps: readonly SopStepRowDb[],
): AdminSopTemplateVersionDetail {
  return {
    versionId: version.id,
    templateId: template.id,
    templateName: template.name,
    caseType: template.case_type,
    versionNumber: version.version_number,
    isPublished: version.is_published,
    publishedAt: version.published_at,
    createdAt: version.created_at,
    steps: steps.map(mapSopStepRow),
  };
}

export function toStepInsertRows(
  versionId: string,
  steps: readonly AdminSopStepUpsert[],
): Array<Record<string, unknown>> {
  return steps.map((step) => ({
    template_version_id: versionId,
    step_code: step.stepCode,
    name: step.name,
    execution_type: step.executionType,
    ai_feature_key: step.aiFeatureKey ?? null,
    prompt_template_id: step.promptTemplateId ?? null,
    input_schema: step.inputSchema,
    depends_on: step.dependsOn,
    requires_verification: step.requiresVerification,
  }));
}

export type { AdminSopTemplateCreateBody };
