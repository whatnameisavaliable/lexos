import { describe, expect, it } from "vitest";
import type { SopStageHandler } from "./sop-stage-handler.js";

describe("SopStageHandler types", () => {
  it("accepts a minimal handler implementation", async () => {
    const handler: SopStageHandler = {
      handle: async () => undefined,
    };
    await expect(handler.handle({} as never)).resolves.toBeUndefined();
  });
});
