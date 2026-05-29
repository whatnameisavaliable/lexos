import { describe, expect, it } from "vitest";
import { assertM0SubtasksComplete } from "./m0-subtasks.js";

describe("M0 gate CLI prerequisites", () => {
  it("assertM0SubtasksComplete passes before running full gate", () => {
    expect(() => assertM0SubtasksComplete()).not.toThrow();
  });
});
