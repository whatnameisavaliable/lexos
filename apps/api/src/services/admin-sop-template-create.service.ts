import type { AdminSopTemplateCreateBody, AuthContext } from "@lexos/shared";
import type { AdminSopRepository } from "../repositories/admin-sop.repository.js";
import { validateSopStepsDag } from "../domain/sop/validate-sop-steps-dag.js";

export interface AdminSopTemplateCreateResult {
  readonly templateId: string;
  readonly versionId: string;
}

/**
 * `POST /api/admin/sops/templates` 创建逻辑模板与初始草稿。
 */
export class AdminSopTemplateCreateService {
  constructor(private readonly repository: AdminSopRepository) {}

  async create(
    actor: AuthContext,
    body: AdminSopTemplateCreateBody,
  ): Promise<AdminSopTemplateCreateResult> {
    if (body.steps && body.steps.length > 0) {
      validateSopStepsDag(body.steps);
    }

    return this.repository.insertTemplateWithInitialDraft(actor.userId, body);
  }
}
