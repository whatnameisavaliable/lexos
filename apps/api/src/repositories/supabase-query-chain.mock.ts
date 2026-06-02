import { vi } from "vitest";

/** Vitest 用 Supabase PostgREST 查询链 mock。 */
export function createSupabaseQueryChain(finalResult: {
  data: unknown;
  error: unknown;
}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "upsert",
    "eq",
    "is",
    "not",
    "order",
    "limit",
    "or",
    "contains",
    "maybeSingle",
    "single",
  ] as const;

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  Object.defineProperty(chain, "then", {
    value: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(finalResult).then(onFulfilled),
  });

  return chain;
}
