import { describe, expect, it } from "vitest";
import {
  CLIENT_TIMESTAMP_HEADER,
  mergeAuditClientMetadata,
  parseAuditClientHeaders,
} from "./audit-client-metadata.js";

describe("audit-client-metadata", () => {
  it("parses client headers case-insensitively", () => {
    const parsed = parseAuditClientHeaders({
      [CLIENT_TIMESTAMP_HEADER]: "2026-05-31T03:00:00.000Z",
      "x-client-timezone": "Asia/Shanghai",
    });
    expect(parsed).toEqual({
      clientTimestamp: "2026-05-31T03:00:00.000Z",
      clientTimezone: "Asia/Shanghai",
    });
  });

  it("merges into metadata snake_case keys", () => {
    const merged = mergeAuditClientMetadata(
      { attempted_username: "alice" },
      {
        clientTimestamp: "2026-05-31T03:00:00.000Z",
        clientTimezone: "Asia/Shanghai",
      },
    );
    expect(merged).toEqual({
      attempted_username: "alice",
      client_timestamp: "2026-05-31T03:00:00.000Z",
      client_timezone: "Asia/Shanghai",
    });
  });
});
