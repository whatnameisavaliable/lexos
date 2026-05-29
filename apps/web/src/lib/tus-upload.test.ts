import { afterEach, describe, expect, it } from "vitest";
import { buildTusObjectName, buildTusUploadOptions } from "./tus-upload.js";

describe("buildTusObjectName", () => {
  it("joins prefix and file name", () => {
    expect(buildTusObjectName("user-1/task-1/", "hearing.mp3")).toBe(
      "user-1/task-1/hearing.mp3",
    );
  });

  it("uses basename only", () => {
    expect(buildTusObjectName("user-1/task-1/", "C:\\path\\trial.mp4")).toBe(
      "user-1/task-1/trial.mp4",
    );
  });
});

describe("buildTusUploadOptions", () => {
  const previous = process.env.NEXT_PUBLIC_STORAGE_BUCKET_MEDIA;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_STORAGE_BUCKET_MEDIA;
    } else {
      process.env.NEXT_PUBLIC_STORAGE_BUCKET_MEDIA = previous;
    }
  });

  it("uses init tus endpoint and env bucket", () => {
    process.env.NEXT_PUBLIC_STORAGE_BUCKET_MEDIA = "media";
    const options = buildTusUploadOptions(
      {
        uploadSessionId: "s1",
        taskId: "t1",
        storageKeyPrefix: "u/t/",
        tusEndpoint:
          "https://example.supabase.co/storage/v1/upload/resumable/sign",
        tusHeaders: { "x-signature": "token" },
      },
      { name: "a.mp3", type: "audio/mpeg" },
    );
    expect(options.endpoint).toContain("resumable/sign");
    expect(options.headers["x-signature"]).toBe("token");
    expect(options.metadata.bucketName).toBe("media");
    expect(options.metadata.objectName).toBe("u/t/a.mp3");
  });
});
