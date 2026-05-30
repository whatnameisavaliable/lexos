import { describe, expect, it, vi, beforeEach } from "vitest";
import { WorkerStorageAdapter } from "./worker-storage.adapter.js";

describe("WorkerStorageAdapter", () => {
  const download = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    download.mockResolvedValue({
      data: {
        stream: () =>
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode("audio-bytes"));
              controller.close();
            },
          }),
      },
      error: null,
    });
  });

  it("downloads object to local file", async () => {
    const client = {
      storage: {
        from: vi.fn(() => ({ download })),
      },
    };
    const adapter = new WorkerStorageAdapter(
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseServiceRoleKey: "service-key",
      },
      { storageBucketMedia: "media" },
      () => client as never,
    );

    const target = `${process.cwd()}/tmp-test/worker-storage/sample.mp3`;
    await adapter.downloadToFile("user/task/sample.mp3", target);
    expect(download).toHaveBeenCalledWith("user/task/sample.mp3");
  });

  it("throws when download fails", async () => {
    download.mockResolvedValueOnce({
      data: null,
      error: { message: "not found" },
    });
    const client = {
      storage: { from: vi.fn(() => ({ download })) },
    };
    const adapter = new WorkerStorageAdapter(
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseServiceRoleKey: "service-key",
      },
      { storageBucketMedia: "media" },
      () => client as never,
    );

    await expect(
      adapter.downloadToFile("missing.mp3", "/tmp/missing.mp3"),
    ).rejects.toThrow(/Storage download failed/);
  });
});
