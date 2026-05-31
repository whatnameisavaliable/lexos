import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiPromptRepository } from "../repositories/ai-prompt.repository.js";

/**
 * 删除 Prompt 模板（草稿与已发布均可；运行时按功能点取最新 published 版本）。
 */
export class AiPromptDeleteService {
  constructor(private readonly promptRepository: AiPromptRepository) {}

  async delete(actor: AuthContext, id: string): Promise<void> {
    void actor;
    const existing = await this.promptRepository.findById(id);
    if (!existing) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Prompt not found");
    }
    await this.promptRepository.delete(id);
  }
}
