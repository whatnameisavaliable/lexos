import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  DRIVE_SEARCH_SQL_MARKER,
  DriveSearchRepository,
} from "./drive-search.repository.js";

const repoDir = path.dirname(fileURLToPath(import.meta.url));

describe("DriveSearchRepository", () => {
  it("search SQL uses pg_trgm similarity and not simple tsvector", () => {
    const source = readFileSync(
      path.join(repoDir, "drive-search.repository.ts"),
      "utf8",
    );
    expect(source).toContain(DRIVE_SEARCH_SQL_MARKER);
    expect(source).toContain("polished_text % $2");
    const sqlStart = source.indexOf("const sql =");
    expect(source.slice(sqlStart)).not.toContain("to_tsvector('simple'");
  });

  it("maps rows into search hits", async () => {
    const repo = new DriveSearchRepository("postgres://localhost/db");
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          task_id: "task-1",
          task_title: "访谈",
          archive_folder_id: "folder-1",
          matched_field: "polished_text",
          polished_text: "关于合同违约的讨论",
          summary_text: "摘要",
          score: 0.8,
        },
      ],
    });
    (repo as unknown as { pool: { query: typeof query } }).pool = { query };

    const result = await repo.searchTranscripts("user-1", {
      q: "合同",
      limit: 50,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.taskId).toBe("task-1");
    expect(result.items[0]?.snippet).toContain("合同");
    expect(query.mock.calls[0]?.[0]).not.toContain("to_tsvector('simple'");
  });
});
