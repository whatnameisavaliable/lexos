import { describe, expect, it, vi, beforeEach } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { TranscriptionUploadCompleteService } from "./transcription-upload-complete.service.js";

const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

vi.mock("pg", () => ({
  default: {
    Pool: vi.fn(() => ({
      connect: vi.fn(async () => mockClient),
    })),
  },
}));

describe("TranscriptionUploadCompleteService", () => {
  const actor = createAuthContext({
    userId: "user-1",
    role: "lawyer",
    username: "lawyer1",
    requiresPasswordChange: false,
  });

  const uploadSessionRepository = {
    findByIdForOwner: vi.fn(),
    markCompleted: vi.fn(),
  };
  const taskRepository = { findById: vi.fn() };
  const taskWriteRepository = { updateForUploadComplete: vi.fn() };
  const storageAdapter = { listObjectsByPrefix: vi.fn() };
  const taskStateRepository = { transitionTaskStatus: vi.fn() };
  const outboxRepository = { insertInTransaction: vi.fn() };

  const service = new TranscriptionUploadCompleteService(
    {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon",
      supabaseServiceRoleKey: "service",
      supabaseJwtSecret: "jwt",
      supabaseDbUrl: "postgres://localhost/db",
    },
    taskRepository as never,
    taskWriteRepository as never,
    uploadSessionRepository as never,
    storageAdapter as never,
    taskStateRepository as never,
    outboxRepository as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rows: [] };
      }
      return { rows: [] };
    });
    mockClient.release.mockReset();
  });

  it("rejects expired upload session", async () => {
    uploadSessionRepository.findByIdForOwner.mockResolvedValue({
      id: "session-1",
      taskId: "task-1",
      ownerId: "user-1",
      storageKeyPrefix: "user-1/task-1/",
      expectedMaxBytes: 1000,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      completedAt: null,
    });

    await expect(
      service.complete(actor, "token", { uploadSessionId: "session-1" }),
    ).rejects.toMatchObject({ code: ErrorCode.UPLOAD_SESSION_INVALID });
  });

  it("rejects when storage has no objects", async () => {
    uploadSessionRepository.findByIdForOwner.mockResolvedValue({
      id: "session-1",
      taskId: "task-1",
      ownerId: "user-1",
      storageKeyPrefix: "user-1/task-1/",
      expectedMaxBytes: 1000,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      completedAt: null,
    });
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      createdBy: "user-1",
      status: "uploading",
      sourceStorageKey: "user-1/task-1/a.mp3",
      durationSec: 60,
      isMp4: false,
    });
    storageAdapter.listObjectsByPrefix.mockResolvedValue([]);

    await expect(
      service.complete(actor, "token", { uploadSessionId: "session-1" }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });
});
