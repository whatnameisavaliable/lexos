import { z } from "zod";
import { MAX_PAGE_LIMIT, parseLimit } from "../api/pagination.js";

const parentIdSchema = z.string().uuid("parentId must be a UUID");

/**
 * `GET /api/drive/nodes` 查询参数。
 */
export const driveNodesListQuerySchema = z
  .object({
    parentId: parentIdSchema,
    limit: z.union([z.string(), z.number()]).optional(),
    cursor: z.string().trim().min(1).optional(),
  })
  .strict();

/** 原始查询参数（解析 limit 前）。 */
export type DriveNodesListQueryRaw = z.infer<typeof driveNodesListQuerySchema>;

/** 云盘子节点列表查询 DTO（含已解析的 `limit`）。 */
export interface DriveNodesListQuery {
  readonly parentId: string;
  readonly limit: number;
  readonly cursor?: string;
}

/**
 * 解析并校验云盘子节点列表查询参数；失败抛出 `ZodError`。
 */
export function parseDriveNodesListQuery(input: unknown): DriveNodesListQuery {
  const raw = driveNodesListQuerySchema.parse(input);
  const limit = parseLimit({ requested: raw.limit, maxLimit: MAX_PAGE_LIMIT });
  return {
    parentId: raw.parentId,
    limit,
    cursor: raw.cursor,
  };
}
