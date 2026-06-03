import { describe, expect, it } from "vitest";
import { buildSopMediaStorageKeyPrefix } from "../domain/sop/build-sop-storage-key-prefix.js";

describe("sop upload prefix (integration mock)", () => {
  it("storage prefix starts with owner auth uid", () => {
    const ownerId = "00000000-0000-4000-8000-000000000099";
    const pipelineId = "00000000-0000-4000-8000-000000000010";
    const prefix = buildSopMediaStorageKeyPrefix(ownerId, pipelineId);
    expect(prefix.startsWith(`${ownerId}/`)).toBe(true);
    expect(prefix).toBe(`${ownerId}/sops/${pipelineId}/`);
  });
});
