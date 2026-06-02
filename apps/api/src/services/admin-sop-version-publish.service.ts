import type { AuthContext, AdminSopTemplateVersionDetail } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { AdminSopRepository } from "../repositories/admin-sop.repository.js";
import { assertPublishReadiness } from "../domain/sop/assert-publish-readiness.js";
import { assertTemplateVersionEditable } from "../domain/sop/assert-template-version-editable.js";
import { computeNextVersionNumber } from "../domain/sop/compute-next-version-number.js";
import type {
  AuditRequestMeta,
  AuditWriterService,
} from "./audit-writer.service.js";

export interface AdminSopVersionPublishResult {
  readonly versionId: string;
  readonly versionNumber: number;
}

/**
 * `POST /api/admin/sops/template-versions/:version_id/publish` 服务。
 */
export class AdminSopVersionPublishService {
  constructor(
    private readonly repository: AdminSopRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  async publish(
    actor: AuthContext,
    versionId: string,
    meta: AuditRequestMeta = {},
  ): Promise<AdminSopVersionPublishResult> {
    const version = await this.repository.findTemplateVersionById(versionId);
    if (!version) {
      throw new LexosError(
        ErrorCode.RESOURCE_NOT_FOUND,
        "SOP template version not found",
      );
    }

    assertTemplateVersionEditable(version.isPublished);

    type StepDetail = AdminSopTemplateVersionDetail["steps"][number];

    const promptIds = version.steps
      .map((s: StepDetail) => s.promptTemplateId)
      .filter((id: string | null): id is string => Boolean(id));

    const promptBodiesById =
      await this.repository.findPromptBodiesByIds(promptIds);

    const promptsByStep: Record<string, string> = {};
    for (const step of version.steps) {
      if (step.promptTemplateId) {
        promptsByStep[step.stepCode] =
          promptBodiesById[step.promptTemplateId] ?? "";
      }
    }

    const publishNodes = version.steps.map((step: StepDetail) => ({
      stepCode: step.stepCode,
      dependsOn: step.dependsOn,
      executionType: step.executionType,
      aiFeatureKey: step.aiFeatureKey,
      promptTemplateId: step.promptTemplateId,
    }));

    const featureKeys: string[] = [
      ...new Set(
        publishNodes
          .map((s) => s.aiFeatureKey)
          .filter((key): key is string => Boolean(key)),
      ),
    ];
    const mappingExists: Record<string, boolean> = {};
    await Promise.all(
      featureKeys.map(async (featureKey: string) => {
        mappingExists[featureKey] =
          await this.repository.hasFeatureMapping(featureKey);
      }),
    );

    assertPublishReadiness(
      publishNodes,
      promptsByStep,
      (featureKey) => mappingExists[featureKey] ?? false,
    );

    const maxPublished = await this.repository.maxPublishedVersionNumber(
      version.templateId,
    );
    const nextVersionNumber = computeNextVersionNumber(maxPublished);
    const publishedAt = new Date().toISOString();

    await this.repository.publishVersion(
      versionId,
      nextVersionNumber,
      publishedAt,
    );

    await this.auditWriterService.write(
      {
        actorId: actor.userId,
        action: "sop.template.publish",
        targetType: "sop_template_version",
        targetId: versionId,
        metadata: {
          templateId: version.templateId,
          versionNumber: nextVersionNumber,
        },
      },
      meta,
    );

    return { versionId, versionNumber: nextVersionNumber };
  }
}
