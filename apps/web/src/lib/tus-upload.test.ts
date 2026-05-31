import { describe, expect, it } from "vitest";
import { buildTusUploadOptions } from "./tus-upload.js";

describe("buildTusUploadOptions", () => {
  it("uses BFF storageObjectKey for tus metadata", () => {
    const options = buildTusUploadOptions(
      {
        uploadSessionId: "s1",
        taskId: "t1",
        storageKeyPrefix: "u/t/",
        storageObjectKey: "u/t/__.m4a",
        storageBucket: "media",
        tusEndpoint:
          "https://example.supabase.co/storage/v1/upload/resumable/sign",
        tusHeaders: { "x-signature": "token" },
      },
      { name: "录音.m4a", type: "audio/x-m4a" },
    );
    expect(options.endpoint).toContain("resumable/sign");
    expect(options.headers["x-signature"]).toBe("token");
    expect(options.metadata.bucketName).toBe("media");
    expect(options.metadata.objectName).toBe("u/t/__.m4a");
    expect(options.metadata.contentType).toBe("audio/x-m4a");
  });
});
