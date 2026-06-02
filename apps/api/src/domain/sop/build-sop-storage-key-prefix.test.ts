import { describe, expect, it } from "vitest";
import { buildSopMediaStorageKeyPrefix } from "./build-sop-storage-key-prefix.js";

describe("buildSopMediaStorageKeyPrefix", () => {
  it("returns prefix with ownerId as first segment", () => {
    const ownerId = "00000000-0000-4000-8000-000000000001";
    const pipelineId = "00000000-0000-4000-8000-000000000010";
    const prefix = buildSopMediaStorageKeyPrefix(ownerId, pipelineId);
    expect(prefix).toBe(`${ownerId}/sops/${pipelineId}/`);
    expect(prefix.startsWith(`${ownerId}/`)).toBe(true);
  });
});
