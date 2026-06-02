import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import type { AdminSopTemplateVersionDetail } from "@lexos/shared";
import type { AdminSopRepository } from "../repositories/admin-sop.repository.js";

/**
 * `GET /api/admin/sops/template-versions/:version_id` 服务。
 */
export class AdminSopVersionGetService {
  constructor(private readonly repository: AdminSopRepository) {}

  async getVersion(versionId: string): Promise<AdminSopTemplateVersionDetail> {
    const version = await this.repository.findTemplateVersionById(versionId);
    if (!version) {
      throw new LexosError(
        ErrorCode.RESOURCE_NOT_FOUND,
        "SOP template version not found",
      );
    }
    return version;
  }
}
