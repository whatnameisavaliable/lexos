import { describe, expect, it, vi } from "vitest";
import { PIPELINE_STAGE_LLM } from "@lexos/shared";
import { StageRouter } from "./stage-router.js";

describe("StageRouter", () => {
  it("resolves handler by stage name", () => {
    const llmHandler = { handle: vi.fn() };
    const router = new StageRouter({
      "media.extract": { handle: vi.fn() },
      "media.preprocess": { handle: vi.fn() },
      asr: { handle: vi.fn() },
      llm: llmHandler,
      "drive.archive": { handle: vi.fn() },
    });

    expect(router.resolve(PIPELINE_STAGE_LLM)).toBe(llmHandler);
  });
});
