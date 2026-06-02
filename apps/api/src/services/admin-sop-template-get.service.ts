import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { AdminSopRepository } from "../repositories/admin-sop.repository.js";
import type { AdminSopTemplateDetail } from "../repositories/admin-sop.types.js";

/**
 * `GET /api/admin/sops/templates/:template_id` 服务。
 */
export class AdminSopTemplateGetService {
  constructor(private readonly repository: AdminSopRepository) {}

  async getTemplate(templateId: string): Promise<AdminSopTemplateDetail> {
    const template = await this.repository.findTemplateById(templateId);
    if (!template) {
      throw new LexosError(ErrorCode.RESOURCE_NOT_FOUND, "SOP template not found");
    }
    return template;
  }
}
