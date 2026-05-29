import { describe, expect, it } from "vitest";
import { buildTranscriptionTasksQueryString } from "./transcription-api.js";

describe("buildTranscriptionTasksQueryString", () => {
  it("builds query string for list params", () => {
    const qs = buildTranscriptionTasksQueryString({
      limit: 50,
      status: "queued",
      cursor: "2024-01-01T00:00:00.000Z|uuid",
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("limit")).toBe("50");
    expect(params.get("status")).toBe("queued");
    expect(params.get("cursor")).toBe("2024-01-01T00:00:00.000Z|uuid");
  });

  it("returns empty string when no params", () => {
    expect(buildTranscriptionTasksQueryString()).toBe("");
  });
});
