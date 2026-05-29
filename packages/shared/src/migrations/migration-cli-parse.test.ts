import { describe, expect, it } from "vitest";
import { parseSyncedMigrationTimestamps } from "./migration-cli-parse.js";

describe("parseSyncedMigrationTimestamps", () => {
  it("extracts matching local and remote timestamps", () => {
    const sample = `
   Local          | Remote         | Time (UTC)
  ----------------|----------------|---------------------
   20260529102025 | 20260529102025 | 2026-05-29 10:20:25
   20260529110002 | 20260529110002 | 2026-05-29 11:00:02
`;
    expect(parseSyncedMigrationTimestamps(sample)).toEqual([
      "20260529102025",
      "20260529110002",
    ]);
  });
});
