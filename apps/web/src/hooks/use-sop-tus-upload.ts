"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { useActiveUpload } from "@/contexts/active-upload-context";
import { completeSopUpload, initSopUpload } from "@/lib/lawyer-sops-api";
import { buildTusUploadOptions } from "@/lib/tus-upload";

const TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

export interface SopTusUploadOptions {
  readonly pipelineId: string;
  readonly durationSec?: number;
  readonly onProgress?: (percent: number) => void;
  readonly onSuccess?: () => void;
  readonly onError?: (error: Error) => void;
}

export interface UseSopTusUploadResult {
  upload: (file: File) => Promise<void>;
  readonly progress: number;
  readonly isUploading: boolean;
  abort: () => void;
}

/** SOP 上传注册字段（`active-upload-context` · `kind=sop`）。 */
export function buildSopActiveUploadRegister(
  partial: Pick<
    import("@/contexts/active-upload-context").RegisterActiveUploadPartial,
    "taskId" | "fileName" | "pipelineId"
  >,
): import("@/contexts/active-upload-context").RegisterActiveUploadPartial {
  return {
    kind: "sop",
    taskId: partial.taskId,
    fileName: partial.fileName,
    pipelineId: partial.pipelineId,
  };
}

/** 上传中 `beforeunload` 提示处理器。 */
export function createSopBeforeUnloadHandler(): (event: BeforeUnloadEvent) => void {
  return (event: BeforeUnloadEvent) => {
    event.preventDefault();
  };
}

/**
 * SOP 卷宗：initSopUpload → TUS → completeSopUpload（禁止走转写 API）。
 */
export function useSopTusUpload(
  options: SopTusUploadOptions,
): UseSopTusUploadResult {
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

  useEffect(() => {
    if (!isUploading) {
      return;
    }
    const handler = createSopBeforeUnloadHandler();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isUploading]);

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setProgress(0);
      registerUpload(
        buildSopActiveUploadRegister({
          taskId: null,
          fileName: file.name,
          pipelineId: options.pipelineId,
        }),
      );

      try {
        const init = await initSopUpload({
          pipelineId: options.pipelineId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: BigInt(file.size),
          durationSec: options.durationSec,
        });

        registerUpload(
          buildSopActiveUploadRegister({
            taskId: init.uploadSessionId,
            fileName: file.name,
            pipelineId: options.pipelineId,
          }),
        );

        const tusOptions = buildTusUploadOptions(init, file);
        await new Promise<void>((resolve, reject) => {
          const tusUpload = new tus.Upload(file, {
            endpoint: tusOptions.endpoint,
            headers: tusOptions.headers,
            metadata: tusOptions.metadata,
            chunkSize: TUS_CHUNK_SIZE_BYTES,
            retryDelays: [0, 1000, 3000, 5000],
            onError: reject,
            onProgress: (bytesUploaded, bytesTotal) => {
              const percent =
                bytesTotal > 0
                  ? Math.round((bytesUploaded / bytesTotal) * 100)
                  : 0;
              setProgress(percent);
              onProgressRef.current?.(percent);
            },
            onSuccess: () => resolve(),
          });
          uploadRef.current = tusUpload;
          tusUpload.start();
        });

        await completeSopUpload({ uploadSessionId: init.uploadSessionId });
        setProgress(100);
        onSuccessRef.current?.();
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
    [options.pipelineId, options.durationSec, registerUpload, clearUpload],
  );

  return { upload, progress, isUploading, abort };
}
