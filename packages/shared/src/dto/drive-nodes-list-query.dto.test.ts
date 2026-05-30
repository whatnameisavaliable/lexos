import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseDriveNodesListQuery } from "./drive-nodes-list-query.dto.js";

describe("driveNodesListQuerySchema", () => {
  it("defaults limit to 50", () => {
    const query = parseDriveNodesListQuery({
      parentId: "00000000-0000-4000-8000-000000000001",
    });
    expect(query.limit).toBe(50);
  });

  it("requires parentId uuid", () => {
    expect(() => parseDriveNodesListQuery({ parentId: "bad" })).toThrow(
      ZodError,
    );
  });

  it("accepts cursor", () => {
    const query = parseDriveNodesListQuery({
      parentId: "00000000-0000-4000-8000-000000000001",
      cursor: "2024-01-01T00:00:00.000Z|uuid",
    });
    expect(query.cursor).toBeDefined();
  });
});
