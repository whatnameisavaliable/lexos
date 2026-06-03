import type {
  AdminSopStepUpsert,
  AdminSopTemplateStepDetail,
  AdminSopVersionPromptsUpsertBody,
} from "@lexos/shared";

/**
 * 将本地步骤状态聚合为 `PUT .../prompts` 请求体。
 */
export function buildStepsUpsertBody(
  steps: readonly AdminSopTemplateStepDetail[],
): AdminSopVersionPromptsUpsertBody {
  return {
    steps: steps.map(
      (step): AdminSopStepUpsert => ({
        stepCode: step.stepCode,
        name: step.name,
        executionType: step.executionType,
        aiFeatureKey: step.aiFeatureKey ?? undefined,
        promptTemplateId: step.promptTemplateId ?? undefined,
        inputSchema: step.inputSchema ?? {},
        dependsOn: [...step.dependsOn],
        requiresVerification: step.requiresVerification,
      }),
    ),
  };
}

/** 已发布版本禁止保存/发布。 */
export function isVersionEditorReadOnly(isPublished: boolean): boolean {
  return isPublished;
}

/** 新建草稿版本后的编辑页路径。 */
export function adminSopVersionEditorPath(versionId: string): string {
  return `/admin/sops/template-versions/${versionId}`;
}

/** 模板详情页路径。 */
export function adminSopTemplateDetailPath(templateId: string): string {
  return `/admin/sops/templates/${templateId}`;
}
