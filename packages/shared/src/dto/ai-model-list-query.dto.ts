import { z } from "zod";
import { MAX_PAGE_LIMIT, parseLimit } from "../api/pagination.js";
import {
  AI_PROVIDER_KIND_VALUES,
  type AiProviderKind,
} from "../enums/ai-provider-kind.js";

const providerKindFilterSchema = z.enum(
  AI_PROVIDER_KIND_VALUES as [AiProviderKind, ...AiProviderKind[]],
);

/**
 * `GET /api/admin/ai/models` 查询参数。
 */
export const aiModelListQuerySchema = z
  .object({
    limit: z.union([z.string(), z.number()]).optional(),
    cursor: z.string().trim().min(1).optional(),
    providerKind: providerKindFilterSchema.optional(),
    isEnabled: z
      .union([z.literal("true"), z.literal("false"), z.boolean()])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        if (value === true || value === "true") return true;
        if (value === false || value === "false") return false;
        return undefined;
      }),
  });

/** 原始查询参数（解析 limit 前）。 */
export type AiModelListQueryRaw = z.infer<typeof aiModelListQuerySchema>;

/** 模型列表查询 DTO（含已解析的 `limit`）。 */
export interface AiModelListQuery {
  readonly limit: number;
  readonly cursor?: string;
  readonly providerKind?: AiProviderKind;
  readonly isEnabled?: boolean;
}

/**
 * 解析并校验模型列表查询参数；失败抛出 `ZodError`。
 */
export function parseAiModelListQuery(input: unknown): AiModelListQuery {
  const raw = aiModelListQuerySchema.parse(input);
  const limit = parseLimit({ requested: raw.limit, maxLimit: MAX_PAGE_LIMIT });
  return {
    limit,
    cursor: raw.cursor,
    providerKind: raw.providerKind,
    isEnabled: raw.isEnabled,
  };
}
