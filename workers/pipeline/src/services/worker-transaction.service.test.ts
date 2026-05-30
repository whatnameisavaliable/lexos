import { describe, expect, it, vi, beforeEach } from "vitest";
import { PIPELINE_STAGE_MEDIA_PREPROCESS } from "@lexos/shared";
import { WorkerTransactionService } from "./worker-transaction.service.js";

const mockClient = { query: vi.fn() };

describe("WorkerTransactionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("transitions status, inserts next outbox, and marks published", async () => {
    const taskRepository = {
      transitionTaskStatus: vi.fn().mockResolvedValue(true),
    };
    const outboxRepository = {
      insertInTransaction: vi.fn().mockResolvedValue("next-evt"),
      markPublished: vi.fn().mockResolvedValue(undefined),
    };
    const service = new WorkerTransactionService(
      taskRepository as never,
      outboxRepository as never,
    );

    await service.completeStage(mockClient as never, {
      outboxEventId: "evt-1",
      taskId: "task-1",
      fromStatus: "queued",
      toStatus: "preprocessing",
      nextOutbox: {
        aggregateType: "transcription_task",
        aggregateId: "task-1",
        eventType: "task.stage.asr",
        payload: { stage: "asr", taskId: "task-1" },
      },
    });

    expect(taskRepository.transitionTaskStatus).toHaveBeenCalledWith(
      mockClient,
      "task-1",
      "queued",
      "preprocessing",
    );
    expect(outboxRepository.insertInTransaction).toHaveBeenCalled();
    expect(outboxRepository.markPublished).toHaveBeenCalledWith(
      mockClient,
      "evt-1",
    );
  });

  it("throws when transition_task_status returns false", async () => {
    const service = new WorkerTransactionService(
      {
        transitionTaskStatus: vi.fn().mockResolvedValue(false),
      } as never,
      { insertInTransaction: vi.fn(), markPublished: vi.fn() } as never,
    );

    await expect(
      service.completeStage(mockClient as never, {
        outboxEventId: "evt-1",
        taskId: "task-1",
        fromStatus: "queued",
        toStatus: "extracting",
      }),
    ).rejects.toThrow(/transition_task_status failed/);
  });

  it("skips transition when from/to omitted", async () => {
    const taskRepository = { transitionTaskStatus: vi.fn() };
    const outboxRepository = {
      insertInTransaction: vi.fn(),
      markPublished: vi.fn().mockResolvedValue(undefined),
    };
    const service = new WorkerTransactionService(
      taskRepository as never,
      outboxRepository as never,
    );

    await service.completeStage(mockClient as never, {
      outboxEventId: "evt-1",
      taskId: "task-1",
      nextOutbox: {
        aggregateType: "transcription_task",
        aggregateId: "task-1",
        eventType: `task.stage.${PIPELINE_STAGE_MEDIA_PREPROCESS}`,
        payload: { stage: PIPELINE_STAGE_MEDIA_PREPROCESS },
      },
    });

    expect(taskRepository.transitionTaskStatus).not.toHaveBeenCalled();
    expect(outboxRepository.markPublished).toHaveBeenCalled();
  });
});
