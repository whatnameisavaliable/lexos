import { describe, expect, it, vi, beforeEach } from "vitest";
import { PIPELINE_STAGE_ASR } from "@lexos/shared";
import { StageIdempotencyMiddleware } from "./stage-idempotency.middleware.js";

const mockClient = {
  query: vi.fn(),
};

describe("StageIdempotencyMiddleware", () => {
  const middleware = new StageIdempotencyMiddleware();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns proceed true on first insert", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: "run-1" }] });

    const result = await middleware.tryBeginRun(mockClient as never, {
      stage: PIPELINE_STAGE_ASR,
      outboxEventId: "evt-1",
      taskId: "task-1",
    });

    expect(result.proceed).toBe(true);
    expect(result.existingRunId).toBe("run-1");
  });

  it("returns proceed false on unique violation", async () => {
    mockClient.query
      .mockRejectedValueOnce({ code: "23505" })
      .mockResolvedValueOnce({ rows: [{ id: "run-existing" }] });

    const result = await middleware.tryBeginRun(mockClient as never, {
      stage: PIPELINE_STAGE_ASR,
      outboxEventId: "evt-1",
      taskId: "task-1",
      attempt: 1,
    });

    expect(result.proceed).toBe(false);
    expect(result.existingRunId).toBe("run-existing");
  });

  it("marks run succeeded", async () => {
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 1 });
    await middleware.markSucceeded(mockClient as never, "run-1");
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'succeeded'"),
      ["run-1"],
    );
  });
});
