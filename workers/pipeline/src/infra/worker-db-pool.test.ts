import { describe, expect, it, vi } from "vitest";
import { WorkerDbPool, createWorkerDbPool } from "./worker-db-pool.js";

describe("WorkerDbPool", () => {
  it("creates pool with WORKER_DB_URL and application_name", () => {
    const poolFactory = vi.fn(() => ({
      end: vi.fn(),
      on: vi.fn(),
      setMaxListeners: vi.fn(),
    }));
    const workerPool = new WorkerDbPool(
      { outboxDbUrl: "postgres://worker/db" },
      poolFactory as never,
    );

    expect(poolFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: "postgres://worker/db",
        max: 5,
        application_name: "lexos-pipeline-worker",
      }),
    );
  });

  it("uses prepare:false and lower max for Supabase transaction pooler :6543", () => {
    const poolFactory = vi.fn(() => ({
      end: vi.fn(),
      on: vi.fn(),
      setMaxListeners: vi.fn(),
    }));
    new WorkerDbPool(
      {
        outboxDbUrl:
          "postgres://u:p@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
      },
      poolFactory as never,
    );

    expect(poolFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 3,
        prepare: false,
        ssl: { rejectUnauthorized: false },
      }),
    );
  });

  it("createWorkerDbPool is a factory wrapper", () => {
    const poolFactory = vi.fn(() => ({ end: vi.fn() }));
    const workerPool = createWorkerDbPool({ outboxDbUrl: "postgres://x/db" });
    expect(workerPool).toBeInstanceOf(WorkerDbPool);
    void poolFactory;
  });
});
