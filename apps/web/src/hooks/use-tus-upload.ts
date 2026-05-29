"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { useActiveUpload } from "@/contexts/active-upload-context";
import { completeUpload, initUpload } from "@/lib/transcription-api";
import { buildTusUploadOptions } from "@/lib/tus-upload";

/** TUS 分片大小（6 MiB，Supabase 推荐）。 */
const TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

/** 上传元数据（init 前由 UI 收集）。 */
export interface TusUploadMeta {
  readonly title: string;
  readonly durationSec?: number;
  readonly idempotencyKey?: string;
}

export interface UseTusUploadOptions {
  readonly onProgress?: (percent: number) => void;
  readonly onSuccess?: (taskId: string) => void;
  readonly onError?: (error: Error) => void;
}

export interface UseTusUploadResult {
  /** 发起 init → TUS → complete 全流程；成功返回 `taskId`。 */
  upload: (file: File, meta: TusUploadMeta) => Promise<string | undefined>;
  readonly progress: number;
  readonly isUploading: boolean;
  /** 中止当前 TUS 上传并清除进行中标记。 */
  abort: () => void;
}

/**
 * BFF init → TUS 直传 → complete 时序（`ui_design.md` §6.3.3）。
 * 仅使用 init 返回的 `storageKeyPrefix` / `tusEndpoint` / `tusHeaders`。
 */
export function useTusUpload(
  options: UseTusUploadOptions = {},
): UseTusUploadResult {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const uploadRef = useRef<tus.Upload | null>(null);
  const { registerUpload, registerAbortHandler, clearUpload } =
    useActiveUpload();
  const onProgressRef = useRef(options.onProgress);
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onProgressRef.current = options.onProgress;
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onProgress, options.onSuccess, options.onError]);

  const abort = useCallback(() => {
    uploadRef.current?.abort(true);
    uploadRef.current = null;
    setIsUploading(false);
    setProgress(0);
    registerAbortHandler(null);
    clearUpload();
  }, [clearUpload, registerAbortHandler]);

  useEffect(() => {
    if (isUploading) {
      registerAbortHandler(abort);
    } else {
      registerAbortHandler(null);
    }
  }, [isUploading, abort, registerAbortHandler]);

  const upload = useCallback(
    async (file: File, meta: TusUploadMeta): Promise<string | undefined> => {
      setIsUploading(true);
      setProgress(0);
      registerUpload({ taskId: null, fileName: file.name });

      try {
        const init = await initUpload({
          title: meta.title,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: BigInt(file.size),
          durationSec: meta.durationSec,
          idempotencyKey: meta.idempotencyKey,
        });

        registerUpload({ taskId: init.taskId, fileName: file.name });
        const tusOptions = buildTusUploadOptions(init, file);

        await new Promise<void>((resolve, reject) => {
          const tusUpload = new tus.Upload(file, {
            endpoint: tusOptions.endpoint,
            headers: tusOptions.headers,
            metadata: tusOptions.metadata,
            chunkSize: TUS_CHUNK_SIZE_BYTES,
            retryDelays: [0, 1000, 3000, 5000],
            onError: (error) => {
              reject(error);
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              const percent =
                bytesTotal > 0
                  ? Math.round((bytesUploaded / bytesTotal) * 100)
                  : 0;
              setProgress(percent);
              onProgressRef.current?.(percent);
            },
            onSuccess: () => {
              resolve();
            },
          });
          uploadRef.current = tusUpload;
          tusUpload.start();
        });

        await completeUpload({ uploadSessionId: init.uploadSessionId });
        setProgress(100);
        onSuccessRef.current?.(init.taskId);
        return init.taskId;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onErrorRef.current?.(error);
        throw error;
      } finally {
        setIsUploading(false);
        clearUpload();
        uploadRef.current = null;
      }
    },
    [registerUpload, clearUpload],
  );

  return { upload, progress, isUploading, abort };
}
