import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiModelRepository } from "../repositories/ai-model.repository.js";

export class AiModelDeleteService {
  constructor(private readonly aiModelRepository: AiModelRepository) {}

  async delete(actor: AuthContext, id: string): Promise<void> {
    void actor;
    const existing = await this.aiModelRepository.findById(id);
    if (!existing) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Model not found");
    }

    const referenced = await this.aiModelRepository.hasMappingReference(id);
    if (referenced) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Model is referenced by feature mappings",
      );
    }

    await this.aiModelRepository.delete(id);
  }
}
