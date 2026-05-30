import { describe, expect, it, vi } from "vitest";
import { WorkerDbPool, createWorkerDbPool } from "./worker-db-pool.js";

describe("WorkerDbPool", () => {
  it("creates pool with WORKER_DB_URL and application_name", () => {
    const poolFactory = vi.fn(() => ({ end: vi.fn() }));
    const workerPool = new WorkerDbPool(
      { outboxDbUrl: "postgres://worker/db" },
      poolFactory as never,
    );

    expect(poolFactory).toHaveBeenCalledWith({
      connectionString: "postgres://worker/db",
      max: 10,
      application_name: "lexos-pipeline-worker",
    });
    expect(workerPool.getPool()).toBeDefined();
  });

  it("createWorkerDbPool is a factory wrapper", () => {
    const poolFactory = vi.fn(() => ({ end: vi.fn() }));
    const workerPool = createWorkerDbPool({ outboxDbUrl: "postgres://x/db" });
    expect(workerPool).toBeInstanceOf(WorkerDbPool);
    void poolFactory;
  });
});
