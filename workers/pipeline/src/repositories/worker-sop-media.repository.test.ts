import { describe, expect, it, vi } from "vitest";
import { WorkerSopMediaRepository } from "./worker-sop-media.repository.js";
import type { WorkerStorageAdapter } from "../adapters/storage/worker-storage.adapter.js";

describe("WorkerSopMediaRepository", () => {
  it("listMediaObjectKeys returns storage object names", async () => {
    const storageAdapter = {
      listObjectsByPrefix: vi.fn().mockResolvedValue([
        { name: "user-1/sop/pipe-1/hearing.mp3", sizeBytes: 100, mimeType: "audio/mpeg" },
        { name: "user-1/sop/pipe-1/photo.jpg", sizeBytes: 50, mimeType: "image/jpeg" },
      ]),
    } satisfies Pick<WorkerStorageAdapter, "listObjectsByPrefix">;

    const repo = new WorkerSopMediaRepository(storageAdapter as WorkerStorageAdapter);
    const keys = await repo.listMediaObjectKeys("user-1/sop/pipe-1/");

    expect(storageAdapter.listObjectsByPrefix).toHaveBeenCalledWith(
      "user-1/sop/pipe-1/",
    );
    expect(keys).toEqual([
      "user-1/sop/pipe-1/hearing.mp3",
      "user-1/sop/pipe-1/photo.jpg",
    ]);
  });

  it("returns empty array when prefix has no files", async () => {
    const storageAdapter = {
      listObjectsByPrefix: vi.fn().mockResolvedValue([]),
    } satisfies Pick<WorkerStorageAdapter, "listObjectsByPrefix">;

    const repo = new WorkerSopMediaRepository(storageAdapter as WorkerStorageAdapter);
    const keys = await repo.listMediaObjectKeys("user-1/sop/empty/");

    expect(keys).toEqual([]);
  });
});
