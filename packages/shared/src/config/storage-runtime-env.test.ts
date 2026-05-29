import { afterEach, describe, expect, it } from "vitest";
import { loadStorageRuntimeEnvFromProcess } from "./storage-runtime-env.js";

describe("loadStorageRuntimeEnvFromProcess", () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it("loads required bucket names and defaults", () => {
    process.env.STORAGE_BUCKET_MEDIA = "media";
    process.env.STORAGE_BUCKET_EXPORTS = "exports";
    delete process.env.STORAGE_SIGNED_URL_TTL_SEC;
    delete process.env.STORAGE_OPERATION_TIMEOUT_MS;

    const config = loadStorageRuntimeEnvFromProcess();
    expect(config.storageBucketMedia).toBe("media");
    expect(config.storageBucketExports).toBe("exports");
    expect(config.storageSignedUrlTtlSec).toBe(300);
    expect(config.storageOperationTimeoutMs).toBe(120_000);
  });
});
