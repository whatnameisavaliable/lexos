"use client";

import { useCallback } from "react";
import { MAX_SIZE_BYTES } from "@lexos/shared";
import { useSopTusUpload } from "@/hooks/use-sop-tus-upload";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

function formatMaxSize(): string {
  const gib = MAX_SIZE_BYTES / (1024 * 1024 * 1024);
  return `${gib} GiB`;
}

export interface SopMediaUploadZoneProps {
  readonly pipelineId: string;
  readonly onUploaded?: () => void;
}

/** SOP 卷宗 TUS 上传区（限额同转写 · 1GB / 5h）。 */
export function SopMediaUploadZone({
  pipelineId,
  onUploaded,
}: SopMediaUploadZoneProps) {
  const { upload, progress, isUploading, abort } = useSopTusUpload({
    pipelineId,
    onSuccess: onUploaded,
    onError: (err) => toast.error(toApiClientError(err).message),
  });
  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        return;
      }
      try {
        await upload(file);
        toast.success("卷宗上传完成");
      } catch {
        /* toast in onError */
      }
    },
    [upload],
  );

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4">
      <p className="text-muted-foreground text-sm">
        支持音视频/文档卷宗，单文件最大 {formatMaxSize()}，时长不超过 5 小时。
      </p>
      <input
        type="file"
        disabled={isUploading}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {isUploading ? (
        <div className="flex flex-col gap-2">
          <Progress value={progress} />
          <Button type="button" variant="outline" size="sm" onClick={abort}>
            取消上传
          </Button>
        </div>
      ) : null}
    </div>
  );
}
