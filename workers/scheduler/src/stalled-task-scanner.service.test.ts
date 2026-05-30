import { describe, expect, it, vi, beforeEach } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { StalledTaskScannerService } from "./stalled-task-scanner.service.js";

describe("StalledTaskScannerService", () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  const mockPool = {
    connect: vi.fn(async () => mockClient),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes("FROM public.transcription_tasks")) {
        return {
          rows: [
            {
              id: "task-1",
              status: "asr_running",
              retry_count: 1,
              created_by: "user-1",
              is_mp4: false,
            },
          ],
        };
      }
      return { rows: [], rowCount: 1 };
    });
  });

  it("recovers stalled task when retry_count below max", async () => {
    const auditAdapter = {
      appendStalledRecovery: vi.fn().mockResolvedValue(undefined),
    };
    const taskRepository = {
      transitionTaskStatus: vi.fn().mockResolvedValue(true),
      failTask: vi.fn(),
    };
    const outboxRepository = {
      insertInTransaction: vi.fn().mockResolvedValue("outbox-1"),
    };
    const scanner = new StalledTaskScannerService(
      { timeoutMs: 1000, maxRetries: 3 },
      auditAdapter as never,
      taskRepository as never,
      outboxRepository as never,
    );

    const count = await scanner.scanOnce(mockPool as never);

    expect(count).toBe(1);
    expect(taskRepository.transitionTaskStatus).toHaveBeenCalledWith(
      mockClient,
      "task-1",
      "asr_running",
      "queued",
    );
    expect(outboxRepository.insertInTransaction).toHaveBeenCalled();
  });

  it("marks task failed when retries exhausted", async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes("FROM public.transcription_tasks")) {
        return {
          rows: [
            {
              id: "task-2",
              status: "llm_running",
              retry_count: 3,
              created_by: "user-1",
              is_mp4: false,
            },
          ],
        };
      }
      return { rows: [], rowCount: 1 };
    });

    const auditAdapter = {
      appendStalledRecovery: vi.fn().mockResolvedValue(undefined),
    };
    const taskRepository = {
      transitionTaskStatus: vi.fn(),
      failTask: vi.fn().mockResolvedValue(undefined),
    };
    const scanner = new StalledTaskScannerService(
      { timeoutMs: 1000, maxRetries: 3 },
      auditAdapter as never,
      taskRepository as never,
      { insertInTransaction: vi.fn() } as never,
    );

    const count = await scanner.scanOnce(mockPool as never);

    expect(count).toBe(0);
    expect(taskRepository.failTask).toHaveBeenCalledWith(
      mockClient,
      "task-2",
      "llm_running",
      ErrorCode.TASK_STALLED,
      expect.any(String),
    );
  });
});
