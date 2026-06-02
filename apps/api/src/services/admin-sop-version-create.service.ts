import type { AdminSopCreateVersionBody, AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { AdminSopRepository } from "../repositories/admin-sop.repository.js";

export interface AdminSopVersionCreateResult {
  readonly versionId: string;
}

/**
 * `POST /api/admin/sops/templates/:template_id/versions` 服务。
 */
export class AdminSopVersionCreateService {
  constructor(private readonly repository: AdminSopRepository) {}

  async create(
    _actor: AuthContext,
    templateId: string,
    body: AdminSopCreateVersionBody,
  ): Promise<AdminSopVersionCreateResult> {
    const template = await this.repository.findTemplateById(templateId);
    if (!template) {
      throw new LexosError(ErrorCode.RESOURCE_NOT_FOUND, "SOP template not found");
    }

    let sourceVersionId = body.sourceVersionId;
    if (!sourceVersionId) {
      sourceVersionId =
        (await this.repository.findLatestPublishedVersionId(templateId)) ??
        undefined;
    }

    if (!sourceVersionId) {
      throw new LexosError(
        ErrorCode.VALIDATION_FAILED,
        "No published version available to copy; provide sourceVersionId",
      );
    }

    const versionId = await this.repository.copyVersionToNewDraft(
      templateId,
      sourceVersionId,
      _actor.userId,
    );

    return { versionId };
  }
}
