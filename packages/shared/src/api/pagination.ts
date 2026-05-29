import { ErrorCode } from "./error-code.js";

/**
 * 列表分页默认条数（PRD §5.1 · `architecture.md` §2.3 · `CONTEXT_SUMMARY` §7）。
 * 可通过环境变量 `PAGINATION_DEFAULT_LIMIT` 覆盖（须 ≤ {@link MAX_PAGE_LIMIT}）。
 */
export const MAX_PAGE_LIMIT = 50;

/** 解析分页 limit 的可选输入。 */
export interface ParseLimitOptions {
  readonly requested?: string | number | null;
  readonly defaultLimit?: number;
  readonly maxLimit?: number;
}

/**
 * 从环境变量读取默认分页 limit（禁止在业务代码硬编码 50）。
 */
export function getDefaultPageLimitFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = env.PAGINATION_DEFAULT_LIMIT?.trim();
  if (!raw) {
    return MAX_PAGE_LIMIT;
  }
  return parseLimit({ requested: raw });
}

/**
 * 解析并钳制分页 `limit`（1～max，默认 50）。
 * @throws 若请求值非法且无法解析为整数
 */
export function parseLimit(options: ParseLimitOptions = {}): number {
  const maxLimit = options.maxLimit ?? MAX_PAGE_LIMIT;
  const defaultLimit = options.defaultLimit ?? getDefaultPageLimitFromEnv();

  if (
    options.requested === undefined ||
    options.requested === null ||
    options.requested === ""
  ) {
    return clampLimit(defaultLimit, maxLimit);
  }

  const parsed =
    typeof options.requested === "number"
      ? options.requested
      : Number.parseInt(String(options.requested), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(ErrorCode.VALIDATION_FAILED);
  }

  return clampLimit(parsed, maxLimit);
}

function clampLimit(value: number, maxLimit: number): number {
  return Math.min(Math.max(1, Math.floor(value)), maxLimit);
}

/** 分页查询元数据（cursor 模式）。 */
export interface PaginationMeta {
  readonly limit: number;
  readonly cursor?: string;
  readonly nextCursor?: string;
}

/**
 * 构建列表响应常用分页 meta。
 */
export function buildPaginationMeta(
  limit: number,
  nextCursor?: string,
): PaginationMeta {
  return nextCursor ? { limit, nextCursor } : { limit };
}
