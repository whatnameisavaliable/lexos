import type { AiProviderKind } from "../enums/ai-provider-kind.js";

/**
 * 对外公开的 AI 模型凭证（**不含**明文 `apiKey`；`architecture.md` §6.4.3）。
 */
export interface AiModelPublic {
  readonly id: string;
  readonly name: string;
  readonly providerKind: AiProviderKind;
  readonly modelName: string;
  readonly modelId: string;
  /** 掩码展示，如 `sk-***`；创建/轮换后由 API 层生成。 */
  readonly apiKeyMasked: string;
  readonly baseUrl: string | null;
  readonly contextWindow: number | null;
  readonly isEnabled: boolean;
  readonly isDefaultFallback: boolean;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
