import { describe, expect, it } from "vitest";
import { resolveRepoRoot } from "../config/env.js";
import {
  assertM0SubtasksComplete,
  findIncompleteM0Subtasks,
} from "./m0-subtasks.js";

describe("findIncompleteM0Subtasks", () => {
  it("detects unchecked items inside M0 sections only", () => {
    const sample = `
### M0-A Test
- [x] done
- [ ] pending

### M0-E Gate
- [ ] should ignore
`;
    const incomplete = findIncompleteM0Subtasks(sample);
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0]?.section).toBe("### M0-A Test");
  });
});

describe("assertM0SubtasksComplete (integration)", () => {
  it("passes for current docs/tasks.md M0-A～M0-D", () => {
    expect(() => assertM0SubtasksComplete(resolveRepoRoot())).not.toThrow();
  });
});
