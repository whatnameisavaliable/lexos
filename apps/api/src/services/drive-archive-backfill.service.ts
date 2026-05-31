import type { AuthContext } from "@lexos/shared";
import {
  buildArchiveTranscriptObjectKey,
  DRIVE_ARCHIVE_TRANSCRIPT_FILE_NAME,
  guessMimeTypeFromFileName,
  resolveArchiveAudioFileName,
} from "../lib/drive-archive-files.js";
import {
  extractAsrPlainText,
  resolveTranscriptExportSections,
} from "../lib/export-transcript-text.js";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import type { DriveNodeRepository } from "../repositories/drive-node.repository.js";
import type { TranscriptionTranscriptRepository } from "../repositories/transcription-transcript.repository.js";
import type { TranscriptionTaskRepository } from "../repositories/transcription-task.repository.js";

/**
 * 为已完成转写任务的归档目录补写 `drive_nodes` 文件引用（`database.md` §6.3.1）。
 *
 * M5 早期仅创建文件夹；首次打开目录时懒回填，避免录音「看似丢失」。
 */
export class DriveArchiveBackfillService {
  constructor(
    private readonly driveNodeRepository: DriveNodeRepository,
    private readonly taskRepository: TranscriptionTaskRepository,
    private readonly transcriptRepository: TranscriptionTranscriptRepository,
    private readonly storageAdapter: SupabaseStorageAdapter,
  ) {}

  /**
   * 若 `folder` 为转写归档目录且尚无文件子节点，则写入音频/转写稿引用。
   */
  async ensureArchiveFilesForFolder(
    actor: AuthContext,
    accessToken: string,
    folderId: string,
  ): Promise<void> {
    const folder = await this.driveNodeRepository.findById(accessToken, folderId);
    if (
      !folder ||
      folder.nodeType !== "folder" ||
      folder.linkedTaskId == null
    ) {
      return;
    }

    if (actor.role !== "admin" && folder.createdBy !== actor.userId) {
      return;
    }

    const task = await this.taskRepository.findById(
      accessToken,
      folder.linkedTaskId,
    );
    if (!task || task.status !== "completed") {
      return;
    }

    const audioKey = task.audioStorageKey ?? task.sourceStorageKey;
    if (audioKey) {
      await this.ensureAudioFileRef(
        accessToken,
        folder.id,
        task.createdBy,
        audioKey,
        task.sizeBytes,
        task.id,
      );
    }

    const transcript = await this.transcriptRepository.findByTaskId(
      accessToken,
      task.id,
    );
    if (transcript) {
      await this.ensureTranscriptFileRef(
        accessToken,
        folder.id,
        task.createdBy,
        task.id,
        task.title,
        transcript.polishedText,
        transcript.summaryText,
        transcript.asrRawJson,
      );
    }
  }

  private async ensureAudioFileRef(
    accessToken: string,
    folderId: string,
    ownerId: string,
    storageKey: string,
    sizeBytes: number,
    taskId: string,
  ): Promise<void> {
    const existing = await this.driveNodeRepository.findFileByStorageKeyInParent(
      accessToken,
      folderId,
      storageKey,
    );
    if (existing) {
      return;
    }

    const name = resolveArchiveAudioFileName(storageKey);
    await this.driveNodeRepository.createFile(accessToken, {
      createdBy: ownerId,
      parentId: folderId,
      name,
      storageKey,
      mimeType: guessMimeTypeFromFileName(name),
      sizeBytes,
      linkedTaskId: taskId,
    });
  }

  private async ensureTranscriptFileRef(
    accessToken: string,
    folderId: string,
    ownerId: string,
    taskId: string,
    title: string,
    polishedText: string | null,
    summaryText: string | null,
    asrRawJson: unknown | null,
  ): Promise<void> {
    const existing = await this.driveNodeRepository.findFileByNameInParent(
      accessToken,
      folderId,
      DRIVE_ARCHIVE_TRANSCRIPT_FILE_NAME,
    );
    if (existing) {
      return;
    }

    const sections = resolveTranscriptExportSections({
      title,
      polishedText,
      summaryText,
      asrRawJson,
    });
    const bodyParts: string[] = [];
    if (sections.summaryText) {
      bodyParts.push(`【摘要】\n${sections.summaryText}`);
    }
    if (sections.polishedText) {
      bodyParts.push(sections.polishedText);
    }
    const plain = bodyParts.join("\n\n").trim();
    if (!plain) {
      return;
    }

    const objectKey = buildArchiveTranscriptObjectKey(ownerId, taskId);
    await this.storageAdapter.uploadObject(
      "exports",
      objectKey,
      ownerId,
      Buffer.from(plain, "utf8"),
      "text/plain; charset=utf-8",
    );

    await this.driveNodeRepository.createFile(accessToken, {
      createdBy: ownerId,
      parentId: folderId,
      name: DRIVE_ARCHIVE_TRANSCRIPT_FILE_NAME,
      storageKey: objectKey,
      mimeType: "text/plain; charset=utf-8",
      sizeBytes: Buffer.byteLength(plain, "utf8"),
      linkedTaskId: taskId,
    });
  }
}
