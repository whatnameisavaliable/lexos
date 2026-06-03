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

/**
 * 保存前 DAG 校验（与 U2 `validateSopStepsDag` 单入口规则一致，`prd.md` §3.4.1）。
 * @returns 中文错误文案；通过时返回 `null`
 */
export function validateSopStepsDagForSave(
  steps: readonly Pick<AdminSopTemplateStepDetail, "stepCode" | "dependsOn">[],
): string | null {
  if (steps.length === 0) {
    return "至少需要一个步骤";
  }

  const entrySteps = steps.filter((s) => s.dependsOn.length === 0);
  if (entrySteps.length !== 1) {
    const names = entrySteps.map((s) => s.stepCode).join("、");
    return entrySteps.length === 0
      ? "须指定一个入口步骤（depends_on 为空）"
      : `流水线只能有一个入口步骤（depends_on 为空），当前入口有 ${entrySteps.length} 个：${names}。请为后续步骤勾选前置步骤，例如让 step_2 依赖 step_1。`;
  }

  const codes = new Set(steps.map((s) => s.stepCode));
  for (const step of steps) {
    for (const dep of step.dependsOn) {
      if (!codes.has(dep)) {
        return `步骤「${step.stepCode}」的前置「${dep}」不存在`;
      }
      if (dep === step.stepCode) {
        return `步骤「${step.stepCode}」不能依赖自身`;
      }
    }
  }

  return null;
}

/** 将 API 英文 DAG 错误转为中文 Toast。 */
export function localizeSopDagSaveError(message: string): string {
  if (message.includes("exactly one DAG entry")) {
    const match = /found (\d+)/.exec(message);
    const count = match?.[1] ?? "多";
    return `流水线只能有一个入口步骤（depends_on 为空），当前有 ${count} 个。请为 step_2 及之后的步骤勾选前置步骤。`;
  }
  if (message.includes("depends_on cycle")) {
    return "步骤依赖存在环，请检查 depends_on 配置";
  }
  return message;
}
