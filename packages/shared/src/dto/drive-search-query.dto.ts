import { z } from "zod";
import { MAX_PAGE_LIMIT, parseLimit } from "../api/pagination.js";

/** 全文检索关键词最小长度（`database.md` §7.3 · 避免过宽匹配）。 */
export const DRIVE_SEARCH_QUERY_MIN_LENGTH = 2;

/** 全文检索关键词最大长度。 */
export const DRIVE_SEARCH_QUERY_MAX_LENGTH = 256;

const searchQuerySchema = z
  .string()
  .trim()
  .min(DRIVE_SEARCH_QUERY_MIN_LENGTH, "q must be at least 2 characters")
  .max(DRIVE_SEARCH_QUERY_MAX_LENGTH);

/**
 * `GET /api/drive/search` 查询参数。
 */
export const driveSearchQuerySchema = z
  .object({
    q: searchQuerySchema,
    limit: z.union([z.string(), z.number()]).optional(),
    cursor: z.string().trim().min(1).optional(),
  })
  .strict();

/** 原始查询参数（解析 limit 前）。 */
export type DriveSearchQueryRaw = z.infer<typeof driveSearchQuerySchema>;

/** 云盘全文检索查询 DTO（含已解析的 `limit`）。 */
export interface DriveSearchQuery {
  readonly q: string;
  readonly limit: number;
  readonly cursor?: string;
}

/**
 * 解析并校验全文检索查询参数；失败抛出 `ZodError`。
 */
export function parseDriveSearchQuery(input: unknown): DriveSearchQuery {
  const raw = driveSearchQuerySchema.parse(input);
  const limit = parseLimit({ requested: raw.limit, maxLimit: MAX_PAGE_LIMIT });
  return {
    q: raw.q,
    limit,
    cursor: raw.cursor,
  };
}
