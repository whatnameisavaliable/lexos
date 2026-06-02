import { describe, expect, it, vi } from "vitest";
import { AiPromptCreateService } from "./ai-prompt-create.service.js";

describe("AiPromptCreateService", () => {
  it("creates draft prompt", async () => {
    const repo = {
      create: vi.fn(async (input) => ({
        id: "p1",
        feature_key: input.featureKey,
        name: input.name,
        system_prompt: input.systemPrompt,
        version: 1,
        is_published: false,
        created_by: input.createdBy,
        created_at: "t",
        updated_at: "t",
      })),
    };
    const service = new AiPromptCreateService(repo as never);
    const result = await service.create(
      { userId: "admin", role: "admin" } as never,
      {
        featureKey: "llm_legal_summary",
        name: "Summary",
        systemPrompt: "Summarize",
      },
    );
    expect(result.isPublished).toBe(false);
  });

  it("creates sop.strategy_gen prompt", async () => {
    const repo = {
      create: vi.fn(async (input) => ({
        id: "p2",
        feature_key: input.featureKey,
        name: input.name,
        system_prompt: input.systemPrompt,
        version: 1,
        is_published: false,
        created_by: input.createdBy,
        created_at: "t",
        updated_at: "t",
      })),
    };
    const service = new AiPromptCreateService(repo as never);
    const result = await service.create(
      { userId: "admin", role: "admin" } as never,
      {
        featureKey: "sop.strategy_gen",
        name: "Strategy",
        systemPrompt: "Plan",
      },
    );
    expect(result.featureKey).toBe("sop.strategy_gen");
  });
});
