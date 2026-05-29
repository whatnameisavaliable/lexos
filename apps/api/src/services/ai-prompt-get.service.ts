import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiPromptRepository } from "../repositories/ai-prompt.repository.js";
import { toAiPromptPublic } from "./ai-model-mapper.js";

export class AiPromptGetService {
  constructor(private readonly promptRepository: AiPromptRepository) {}

  async getById(id: string) {
    const row = await this.promptRepository.findById(id);
    if (!row) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Prompt not found");
    }
    return toAiPromptPublic(row);
  }
}
