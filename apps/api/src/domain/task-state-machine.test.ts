import { describe, expect, it } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import {
  assertTaskStatusTransition,
  canTransitionTaskStatus,
  TaskInvalidStateError,
} from "./task-state-machine.js";

describe("task-state-machine", () => {
  it("allows uploading to queued", () => {
    expect(canTransitionTaskStatus("uploading", "queued")).toBe(true);
  });

  it("allows queued to extracting or preprocessing", () => {
    expect(canTransitionTaskStatus("queued", "extracting")).toBe(true);
    expect(canTransitionTaskStatus("queued", "preprocessing")).toBe(true);
  });

  it("rejects uploading to completed", () => {
    expect(canTransitionTaskStatus("uploading", "completed")).toBe(false);
    expect(() => assertTaskStatusTransition("uploading", "completed")).toThrow(
      TaskInvalidStateError,
    );
  });

  it("TaskInvalidStateError exposes TASK_INVALID_STATE code", () => {
    try {
      assertTaskStatusTransition("completed", "queued");
    } catch (error) {
      expect(error).toBeInstanceOf(TaskInvalidStateError);
      expect((error as TaskInvalidStateError).code).toBe(
        ErrorCode.TASK_INVALID_STATE,
      );
    }
  });
});
