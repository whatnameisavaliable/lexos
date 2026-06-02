import type { SopExecutionType } from "../enums/sop-execution-type.js";
import type { SopAiFeatureKey } from "../enums/sop-ai-feature-keys.js";

/**
 * 版本详情中的单步定义（`GET .../template-versions/:id`）。
 */
export interface AdminSopTemplateStepDetail {
  readonly id: string;
  readonly stepCode: string;
  readonly name: string;
  readonly executionType: SopExecutionType;
  readonly aiFeatureKey: SopAiFeatureKey | null;
  readonly promptTemplateId: string | null;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly dependsOn: readonly string[];
  readonly requiresVerification: boolean;
  readonly createdAt: string;
}

/**
 * `GET /api/admin/sops/template-versions/:version_id` 响应体。
 */
export interface AdminSopTemplateVersionDetail {
  readonly versionId: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly caseType: string;
  readonly versionNumber: number;
  readonly isPublished: boolean;
  readonly publishedAt: string | null;
  readonly createdAt: string;
  readonly steps: readonly AdminSopTemplateStepDetail[];
}
