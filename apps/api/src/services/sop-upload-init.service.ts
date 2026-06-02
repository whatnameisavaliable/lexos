import type {
  AuthContext,
  SopUploadInitBody,
  TranscriptionUploadInitResponse,
} from "@lexos/shared";
import { MAX_DURATION_SEC, MAX_SIZE_BYTES } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { SupabaseStorageAdapter } from "../adapters/storage/supabase-storage.adapter.js";
import { buildSopMediaStorageKeyPrefix } from "../domain/sop/build-sop-storage-key-prefix.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { CasePipelineRepository } from "../repositories/case-pipeline.repository.js";
import type { SopUploadSessionRepository } from "../repositories/sop-upload-session.repository.js";

function buildSopObjectStorageKey(prefix: string, fileName: string): string {
  const normalizedFileName = fileName.trim().replace(/\s+/g, "_");
  return `${prefix}${normalizedFileName}`;
}

/**
 * `POST /api/sops/uploads/init`。
 */
export class SopUploadInitService {
  constructor(
    private readonly casePipelineRepository: CasePipelineRepository,
    private readonly uploadSessionRepository: SopUploadSessionRepository,
    private readonly storageAdapter: SupabaseStorageAdapter,
    private readonly storageBucketMedia: string,
  ) {}

  async init(
    actor: AuthContext,
    accessToken: string,
    body: SopUploadInitBody,
  ): Promise<TranscriptionUploadInitResponse> {
    if (body.sizeBytes > BigInt(MAX_SIZE_BYTES)) {
      throw new AppHttpError(ErrorCode.RESOURCE_LIMIT_EXCEEDED, "File size exceeds 1 GB");
    }
    if (body.durationSec != null && body.durationSec > MAX_DURATION_SEC) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_LIMIT_EXCEEDED,
        "Duration exceeds 5 hour limit",
      );
    }

    const pipeline = await this.casePipelineRepository.findPipelineForLawyer(
      accessToken,
      body.pipelineId,
    );
    if (!pipeline || pipeline.lawyerId !== actor.userId) {
      throw new AppHttpError(ErrorCode.AUTH_FORBIDDEN, "Pipeline access denied");
    }

    const storageKeyPrefix = buildSopMediaStorageKeyPrefix(actor.userId, body.pipelineId);
    const storageObjectKey = buildSopObjectStorageKey(storageKeyPrefix, body.fileName);
    const session = await this.uploadSessionRepository.create(accessToken, {
      pipelineId: body.pipelineId,
      ownerId: actor.userId,
      storageKeyPrefix,
      expectedMaxBytes: Number(body.sizeBytes),
    });
    const tus = await this.storageAdapter.createResumableUploadUrl({
      objectKey: storageObjectKey,
    });

    return {
      uploadSessionId: session.id,
      taskId: body.pipelineId,
      storageKeyPrefix,
      storageObjectKey,
      storageBucket: this.storageBucketMedia,
      tusEndpoint: tus.tusEndpoint,
      tusHeaders: tus.tusHeaders,
    };
  }
}
