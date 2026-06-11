export type ListQuery = {
  from: number;
  page: number;
  pageSize: number;
  search?: string;
  to: number;
};

export type ListSortOption = {
  ascending: boolean;
  column: string;
  key: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ParseListQueryOptions = {
  defaultPageSize?: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export function parseListQuery(request: Request, options: ParseListQueryOptions = {}): ListQuery {
  const url = new URL(request.url);
  const page = positiveInteger(url.searchParams.get("page"), DEFAULT_PAGE);
  const defaultPageSize = Math.min(Math.max(Math.trunc(options.defaultPageSize ?? DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);
  const pageSize = Math.min(positiveInteger(url.searchParams.get("pageSize"), defaultPageSize), MAX_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const search = normalizedQueryParam(request, "search") ?? normalizedQueryParam(request, "keyword");

  return {
    from,
    page,
    pageSize,
    search,
    to: from + pageSize - 1,
  };
}

export function parseListSort(
  request: Request,
  sortOptions: Record<string, Omit<ListSortOption, "key">>,
  fallbackKey: string,
): ListSortOption {
  const requestedKey = normalizedQueryParam(request, "sort");
  const key = requestedKey && sortOptions[requestedKey] ? requestedKey : fallbackKey;
  const option = sortOptions[key] ?? sortOptions[fallbackKey];

  if (!option) {
    throw new Error(`未知列表排序：${fallbackKey}`);
  }

  return {
    ...option,
    key,
  };
}

export function paginationMeta(query: ListQuery, total: number | null | undefined): PaginationMeta {
  const safeTotal = Math.max(0, total ?? 0);

  return {
    page: query.page,
    pageSize: query.pageSize,
    total: safeTotal,
    totalPages: Math.max(1, Math.ceil(safeTotal / query.pageSize)),
  };
}

export function normalizedQueryParam(request: Request, key: string): string | undefined {
  const value = new URL(request.url).searchParams.get(key)?.trim();

  return value || undefined;
}

export function postgrestLikePattern(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();

  return cleaned ? `%${cleaned}%` : undefined;
}

export function postgrestInFilter(values: string[]): string | undefined {
  const uniqueValues = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

  return uniqueValues.length ? `(${uniqueValues.join(",")})` : undefined;
}

function positiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}
