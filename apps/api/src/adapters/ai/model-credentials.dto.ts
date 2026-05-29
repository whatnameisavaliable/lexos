import type { AiProviderKind } from "@lexos/shared";

/**
 * 解密后的模型凭证（Adapter 入参；禁止写入日志）。
 */
export interface ModelCredentials {
  readonly providerKind: AiProviderKind;
  readonly modelId: string;
  readonly modelName: string;
  readonly apiKey: string;
  readonly baseUrl: string | null;
}

/** 连通性探测结果。 */
export interface HealthCheckResult {
  readonly success: boolean;
  readonly latencyMs: number;
  readonly message?: string;
  readonly errorCode?: string;
}
