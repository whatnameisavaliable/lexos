import type {
  AdminSopVersionPromptsUpsertBody,
  AuthContext,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { AdminSopRepository } from "../repositories/admin-sop.repository.js";
import { assertTemplateVersionEditable } from "../domain/sop/assert-template-version-editable.js";
import { validateSopStepsDag } from "../domain/sop/validate-sop-steps-dag.js";
import type {
  AuditRequestMeta,
  AuditWriterService,
} from "./audit-writer.service.js";

/**
 * `PUT /api/admin/sops/template-versions/:id/prompts` 服务。
 */
export class AdminSopVersionPromptsUpsertService {
  constructor(
    private readonly repository: AdminSopRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  async upsert(
    actor: AuthContext,
    versionId: string,
    body: AdminSopVersionPromptsUpsertBody,
    meta: AuditRequestMeta = {},
  ): Promise<{ readonly versionId: string }> {
    const version = await this.repository.findTemplateVersionById(versionId);
    if (!version) {
      throw new LexosError(
        ErrorCode.RESOURCE_NOT_FOUND,
        "SOP template version not found",
      );
    }

    assertTemplateVersionEditable(version.isPublished);
    validateSopStepsDag(body.steps);

    await this.repository.replaceDraftSteps(versionId, body.steps);

    await this.auditWriterService.write(
      {
        actorId: actor.userId,
        action: "sop.prompt.update",
        targetType: "sop_template_version",
        targetId: versionId,
        metadata: {
          templateId: version.templateId,
          stepCount: body.steps.length,
        },
      },
      meta,
    );

    return { versionId };
  }
}
