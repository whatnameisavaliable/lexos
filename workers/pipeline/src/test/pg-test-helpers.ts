import { vi } from "vitest";
import type { Pool, PoolClient } from "pg";

/** Vitest 用：模拟 `pg.Pool` + 可释放的 `PoolClient`。 */
export function createMockPool(): Pool & { readonly mockClient: PoolClient } {
  const mockClient = {
    release: vi.fn(),
    query: vi.fn(),
    on: vi.fn(),
  } as unknown as PoolClient;

  const pool = {
    connect: vi.fn().mockResolvedValue(mockClient),
    mockClient,
  } as unknown as Pool & { readonly mockClient: PoolClient };

  return pool;
}
