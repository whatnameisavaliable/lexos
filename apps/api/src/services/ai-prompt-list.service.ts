import type { AiPromptRepository } from "../repositories/ai-prompt.repository.js";
import { toAiPromptPublic } from "./ai-model-mapper.js";

export class AiPromptListService {
  constructor(private readonly promptRepository: AiPromptRepository) {}

  async list() {
    const rows = await this.promptRepository.list();
    return { items: rows.map(toAiPromptPublic) };
  }
}
