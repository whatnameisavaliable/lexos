import { describe, expect, it, vi } from "vitest";
import { AiInvocationLogListService } from "./ai-invocation-log-list.service.js";

describe("AiInvocationLogListService", () => {
  it("returns paginated logs", async () => {
    const repo = {
      listAdmin: vi.fn(async () => ({ items: [], nextCursor: undefined })),
    };
    const service = new AiInvocationLogListService(repo as never);
    const result = await service.list({ limit: 50 });
    expect(result.items).toEqual([]);
    expect(result.meta.limit).toBe(50);
  });
});
