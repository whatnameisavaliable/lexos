import { z } from "zod";
import { MAX_PAGE_LIMIT, parseLimit } from "../api/pagination.js";
import {
  AI_FEATURE_KEY_VALUES,
  type AiFeatureKey,
} from "../enums/ai-feature-key.js";

const featureKeyFilterSchema = z.enum(
  AI_FEATURE_KEY_VALUES as [AiFeatureKey, ...AiFeatureKey[]],
);

const outcomeSchema = z.enum(["success", "failure"]);

/**
 * `GET /api/admin/ai/invocation-logs` 查询参数。
 */
export const aiInvocationLogsQuerySchema = z.object({
  limit: z.union([z.string(), z.number()]).optional(),
  cursor: z.string().trim().min(1).optional(),
  taskId: z.string().uuid().optional(),
  featureKey: featureKeyFilterSchema.optional(),
  outcome: outcomeSchema.optional(),
});

/** 原始查询参数。 */
export type AiInvocationLogsQueryRaw = z.infer<typeof aiInvocationLogsQuerySchema>;

/** AI 调用日志列表查询 DTO。 */
export interface AiInvocationLogsQuery {
  readonly limit: number;
  readonly cursor?: string;
  readonly taskId?: string;
  readonly featureKey?: AiFeatureKey;
  readonly outcome?: "success" | "failure";
}

/**
 * 解析并校验调用日志列表查询参数；失败抛出 `ZodError`。
 */
export function parseAiInvocationLogsQuery(
  input: unknown,
): AiInvocationLogsQuery {
  const raw = aiInvocationLogsQuerySchema.parse(input);
  const limit = parseLimit({ requested: raw.limit, maxLimit: MAX_PAGE_LIMIT });
  return {
    limit,
    cursor: raw.cursor,
    taskId: raw.taskId,
    featureKey: raw.featureKey,
    outcome: raw.outcome,
  };
}
