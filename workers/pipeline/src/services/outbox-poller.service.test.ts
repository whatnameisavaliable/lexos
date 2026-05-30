import { describe, expect, it, vi, beforeEach } from "vitest";
import { PIPELINE_STAGE_MEDIA_PREPROCESS } from "@lexos/shared";
import type { OutboxRuntimeEnvConfig } from "@lexos/shared/config";
import { OutboxPollerService } from "./outbox-poller.service.js";

const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

const mockPool = {
  connect: vi.fn(async () => mockClient),
};

vi.mock("pg", () => ({
  default: {
    Pool: vi.fn(() => mockPool),
  },
}));

const mockProcessStage = vi.fn();

const mockHandleMaxAttempts = vi.fn();

vi.mock("./outbox-failure.handler.js", () => ({
  OutboxFailureHandler: vi.fn(() => ({
    handleMaxAttempts: mockHandleMaxAttempts,
  })),
}));

const env: OutboxRuntimeEnvConfig = {
  outboxDbUrl: "postgres://localhost/db",
  outboxPollIntervalMs: 1000,
  outboxMaxAttempts: 3,
  supabaseUrl: "https://example.supabase.co",
  supabaseServiceRoleKey: "service-key",
};

describe("OutboxPollerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes("SELECT id, aggregate_type")) {
        return {
          rows: [
            {
              id: "evt-1",
              aggregate_type: "transcription_task",
              aggregate_id: "task-1",
              event_type: "task.queued",
              payload: {
                stage: PIPELINE_STAGE_MEDIA_PREPROCESS,
                taskId: "task-1",
                createdBy: "user-1",
                isMp4: false,
              },
              publish_attempts: 0,
            },
          ],
        };
      }
      if (sql.includes("SET published_at")) {
        return { rowCount: 1 };
      }
      if (sql.includes("publish_attempts = publish_attempts + 1")) {
        return { rows: [{ publish_attempts: 3 }] };
      }
      return { rows: [], rowCount: 0 };
    });
  });

  it("processes stage and marks published on success", async () => {
    mockProcessStage.mockResolvedValue(undefined);
    const poller = new OutboxPollerService(
      env,
      mockPool as never,
      { processStage: mockProcessStage },
    );

    const count = await poller.pollOnce();

    expect(count).toBe(1);
    expect(mockProcessStage).toHaveBeenCalledWith(
      expect.objectContaining({ id: "evt-1" }),
      expect.objectContaining({ taskId: "task-1", stage: PIPELINE_STAGE_MEDIA_PREPROCESS }),
    );
    expect(mockHandleMaxAttempts).not.toHaveBeenCalled();
    await poller.stop();
  });

  it("increments attempts and invokes alert hook when stage fails at max", async () => {
    mockProcessStage.mockRejectedValue(new Error("stage failed"));
    const alertHook = vi.fn();
    const poller = new OutboxPollerService(
      env,
      mockPool as never,
      { processStage: mockProcessStage },
      alertHook,
    );

    const count = await poller.pollOnce();

    expect(count).toBe(0);
    expect(mockHandleMaxAttempts).toHaveBeenCalledWith(
      mockClient,
      expect.objectContaining({ id: "evt-1", publishAttempts: 3 }),
      "stage failed",
    );
    await poller.stop();
  });

  it("skips events when no stage processor registered", async () => {
    const poller = new OutboxPollerService(env, mockPool as never);

    const count = await poller.pollOnce();

    expect(count).toBe(0);
    expect(mockProcessStage).not.toHaveBeenCalled();
    await poller.stop();
  });
});
