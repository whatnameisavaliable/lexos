import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  buildTusResumableSignEndpoint,
  SupabaseStorageAdapter,
} from "./supabase-storage.adapter.js";

const supabaseEnv = {
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon-key",
  supabaseServiceRoleKey: "service-role-key",
  supabaseJwtSecret: "jwt-secret",
  supabaseDbUrl: "postgres://localhost/db",
};

const storageEnv = {
  storageBucketMedia: "media",
  storageBucketExports: "exports",
  storageSignedUrlTtlSec: 300,
  storageOperationTimeoutMs: 120_000,
};

function createMockStorageApi() {
  return {
    list: vi.fn(),
    info: vi.fn(),
    createSignedUploadUrl: vi.fn(),
    createSignedUrl: vi.fn(),
  };
}

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockFrom },
  })),
}));

describe("buildTusResumableSignEndpoint", () => {
  it("builds resumable sign path from SUPABASE_URL", () => {
    expect(buildTusResumableSignEndpoint("https://proj.supabase.co/")).toBe(
      "https://proj.supabase.co/storage/v1/upload/resumable/sign",
    );
  });
});

describe("SupabaseStorageAdapter", () => {
  let bucketApi: ReturnType<typeof createMockStorageApi>;

  beforeEach(() => {
    bucketApi = createMockStorageApi();
    mockFrom.mockReturnValue(bucketApi);
    vi.mocked(createClient).mockClear();
  });

  it("uses service_role client from env", () => {
    new SupabaseStorageAdapter(supabaseEnv, storageEnv);
    expect(createClient).toHaveBeenCalledWith(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      expect.objectContaining({ auth: expect.any(Object) }),
    );
  });

  it("lists file objects under prefix via media bucket", async () => {
    bucketApi.list.mockResolvedValue({
      data: [
        {
          name: "hearing.mp3",
          id: "obj-1",
          metadata: { size: 100, mimetype: "audio/mpeg" },
        },
        { name: "subdir", id: null, metadata: null },
      ],
      error: null,
    });

    const adapter = new SupabaseStorageAdapter(supabaseEnv, storageEnv);
    const objects = await adapter.listObjectsByPrefix("user-1/task-1/");

    expect(mockFrom).toHaveBeenCalledWith("media");
    expect(bucketApi.list).toHaveBeenCalledWith("user-1/task-1/", {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });
    expect(objects).toEqual([
      {
        name: "user-1/task-1/hearing.mp3",
        sizeBytes: 100,
        mimeType: "audio/mpeg",
      },
    ]);
  });

  it("returns null when headObject target is missing", async () => {
    bucketApi.info.mockResolvedValue({
      data: null,
      error: { message: "Object not found" },
    });

    const adapter = new SupabaseStorageAdapter(supabaseEnv, storageEnv);
    const head = await adapter.headObject("user-1/task-1/missing.mp3");
    expect(head).toBeNull();
  });

  it("createResumableUploadUrl returns tus endpoint and x-signature header", async () => {
    const secretToken = "signed-upload-token-secret";
    bucketApi.createSignedUploadUrl.mockResolvedValue({
      data: {
        path: "user-1/task-1/hearing.mp3",
        token: secretToken,
        signedUrl: `https://example.supabase.co/upload/sign?token=${secretToken}`,
      },
      error: null,
    });

    const adapter = new SupabaseStorageAdapter(supabaseEnv, storageEnv);
    const meta = await adapter.createResumableUploadUrl({
      objectKey: "user-1/task-1/hearing.mp3",
    });

    expect(meta.tusEndpoint).toBe(
      "https://example.supabase.co/storage/v1/upload/resumable/sign",
    );
    expect(meta.tusHeaders["x-signature"]).toBe(secretToken);
    expect(meta.objectKey).toBe("user-1/task-1/hearing.mp3");
  });

  it("does not log signed upload token", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    bucketApi.createSignedUploadUrl.mockResolvedValue({
      data: {
        path: "user-1/task-1/hearing.mp3",
        token: "do-not-log-me",
        signedUrl: "https://example.supabase.co/upload/sign",
      },
      error: null,
    });

    const adapter = new SupabaseStorageAdapter(supabaseEnv, storageEnv);
    await adapter.createResumableUploadUrl({
      objectKey: "user-1/task-1/hearing.mp3",
    });

    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls]
      .flat()
      .map((arg) => String(arg))
      .join(" ");
    expect(logged).not.toContain("do-not-log-me");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("createSignedDownloadUrl validates owner prefix and returns signed URL", async () => {
    bucketApi.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.supabase.co/signed" },
      error: null,
    });

    const adapter = new SupabaseStorageAdapter(supabaseEnv, storageEnv);
    const result = await adapter.createSignedDownloadUrl(
      "media",
      "user-1/task-1/audio.mp3",
      "user-1",
    );

    expect(mockFrom).toHaveBeenCalledWith("media");
    expect(bucketApi.createSignedUrl).toHaveBeenCalledWith(
      "user-1/task-1/audio.mp3",
      300,
    );
    expect(result.signedUrl).toBe("https://example.supabase.co/signed");
    expect(result.expiresInSec).toBe(300);
  });

  it("createSignedDownloadUrl rejects key not owned by user", async () => {
    const adapter = new SupabaseStorageAdapter(supabaseEnv, storageEnv);
    await expect(
      adapter.createSignedDownloadUrl(
        "media",
        "other-user/task-1/audio.mp3",
        "user-1",
      ),
    ).rejects.toThrow(/does not belong to owner/);
  });
});
