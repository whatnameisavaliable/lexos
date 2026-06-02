import { ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES } from "@lexos/shared";
import type { AiFeatureMappingRepository } from "../repositories/ai-feature-mapping.repository.js";
import {
  toAiFeatureMappingPublic,
  type AiFeatureMappingPublic,
} from "./ai-model-mapper.js";

export interface AiFeatureMappingListResponse {
  readonly items: readonly AiFeatureMappingPublic[];
}

export class AiFeatureMappingListService {
  constructor(
    private readonly mappingRepository: AiFeatureMappingRepository,
  ) {}

  async list(): Promise<AiFeatureMappingListResponse> {
    const rows = await this.mappingRepository.listAll();
    const byKey = new Map(rows.map((row) => [row.feature_key, row]));
    const items = ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES.map((featureKey) =>
      toAiFeatureMappingPublic(featureKey, byKey.get(featureKey) ?? null),
    );
    return { items };
  }
}
