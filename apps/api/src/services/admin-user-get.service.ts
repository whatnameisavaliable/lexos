import { ErrorCode } from "@lexos/shared/api";
import type { AdminUserRepository } from "../repositories/admin-user.repository.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { toAdminUserDetailDto, type AdminUserDetailDto } from "./admin-user-mapper.js";

/**
 * 管理员查询单个用户详情。
 */
export class AdminUserGetService {
  constructor(private readonly adminUserRepository: AdminUserRepository) {}

  async getById(userId: string): Promise<AdminUserDetailDto> {
    const record = await this.adminUserRepository.findUserById(userId);
    if (!record) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
    }
    return toAdminUserDetailDto(record);
  }
}
