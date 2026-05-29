import type { AiPromptUpdateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiPromptRepository } from "../repositories/ai-prompt.repository.js";
import { toAiPromptPublic } from "./ai-model-mapper.js";

export class AiPromptUpdateService {
  constructor(private readonly promptRepository: AiPromptRepository) {}

  async update(id: string, body: AiPromptUpdateBody) {
    const existing = await this.promptRepository.findById(id);
    if (!existing) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Prompt not found");
    }
    if (existing.is_published) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Published prompts cannot be edited; create a new draft",
      );
    }

    const row = await this.promptRepository.update(id, {
      name: body.name,
      systemPrompt: body.systemPrompt,
    });
    return toAiPromptPublic(row);
  }
}
