import type { AiPromptCreateBody, AuthContext } from "@lexos/shared";
import type { AiPromptRepository } from "../repositories/ai-prompt.repository.js";
import { toAiPromptPublic } from "./ai-model-mapper.js";

export class AiPromptCreateService {
  constructor(private readonly promptRepository: AiPromptRepository) {}

  async create(actor: AuthContext, body: AiPromptCreateBody) {
    const row = await this.promptRepository.create({
      featureKey: body.featureKey,
      name: body.name,
      systemPrompt: body.systemPrompt,
      createdBy: actor.userId,
    });
    return toAiPromptPublic(row);
  }
}
