import { describe, expect, it, vi } from "vitest";
import { AiPromptListService } from "./ai-prompt-list.service.js";

describe("AiPromptListService", () => {
  it("maps prompt rows", async () => {
    const repo = {
      list: vi.fn(async () => [
        {
          id: "p1",
          feature_key: "llm_transcript_polish",
          name: "Polish",
          system_prompt: "You are helpful",
          version: 1,
          is_published: false,
          created_by: "a",
          created_at: "t",
          updated_at: "t",
        },
      ]),
    };
    const service = new AiPromptListService(repo as never);
    const result = await service.list();
    expect(result.items[0]?.systemPrompt).toBe("You are helpful");
  });
});
