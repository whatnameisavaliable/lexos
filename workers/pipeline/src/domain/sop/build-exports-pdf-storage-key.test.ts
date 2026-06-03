import { describe, expect, it } from "vitest";
import { buildExportsPdfStorageKey } from "./build-exports-pdf-storage-key.js";

describe("buildExportsPdfStorageKey", () => {
  it("starts with ownerId and ends with artifact pdf name", () => {
    const key = buildExportsPdfStorageKey(
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003",
    );

    expect(key.startsWith("00000000-0000-4000-8000-000000000001/")).toBe(true);
    expect(key).toBe(
      "00000000-0000-4000-8000-000000000001/sops/00000000-0000-4000-8000-000000000002/00000000-0000-4000-8000-000000000003.pdf",
    );
  });
});
