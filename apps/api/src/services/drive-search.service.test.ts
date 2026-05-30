import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveSearchService } from "./drive-search.service.js";

describe("DriveSearchService", () => {
  it("searches only actor user transcripts", async () => {
    const repo = {
      searchTranscripts: vi.fn().mockResolvedValue({
        items: [
          {
            taskId: "t1",
            taskTitle: "访谈",
            archiveFolderId: "f1",
            matchedField: "polished_text",
            snippet: "合同",
            score: 0.5,
          },
        ],
      }),
    };
    const service = new DriveSearchService(repo as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    const result = await service.search(actor, { q: "合同", limit: 50 });
    expect(repo.searchTranscripts).toHaveBeenCalledWith("u1", {
      q: "合同",
      limit: 50,
    });
    expect(result.items[0]?.archiveFolderId).toBe("f1");
  });
});
