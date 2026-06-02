"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZodError } from "zod";
import {
  ALLOWED_TRANSCRIPTION_MIME_TYPES,
  MAX_SIZE_BYTES,
  parseTranscriptionUploadInitBody,
} from "@lexos/shared";
import { useTusUpload } from "@/hooks/use-tus-upload";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadProgressBar } from "./upload-progress-bar";
import { toast } from "sonner";

function titleFromFileName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

function formatMaxSize(): string {
  const gib = MAX_SIZE_BYTES / (1024 * 1024 * 1024);
  return `${gib} GiB`;
}

export interface NewTranscriptionDialogProps {
  readonly onCreated: () => void;
}

/**
 * 新建转写任务：选文件 + 元数据 → `useTusUpload`（`ui_design.md` §6.3.3）。
 */
export function NewTranscriptionDialog({ onCreated }: NewTranscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [maxSpeakersInput, setMaxSpeakersInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, progress, isUploading, abort } = useTusUpload({
    onSuccess: () => {
      toast.success("上传完成，任务已进入排队");
      setOpen(false);
      resetForm();
      onCreated();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  function resetForm() {
    setTitle("");
    setMaxSpeakersInput("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next && isUploading) {
      abort();
    }
    setOpen(next);
    if (!next) {
      resetForm();
    }
  }

  function handleFileChange(selected: File | null) {
    setError(null);
    setFile(selected);
    if (selected && !title.trim()) {
      setTitle(titleFromFileName(selected.name));
    }
  }

  const startUpload = useCallback(async () => {
    if (!file) {
      setError("请选择音频或视频文件");
      return;
    }
    const mimeType = file.type.trim().toLowerCase();
    if (
      !mimeType ||
      !(ALLOWED_TRANSCRIPTION_MIME_TYPES as readonly string[]).includes(mimeType)
    ) {
      setError("不支持的文件格式，请选择 MP3、M4A、WAV 或 MP4");
      return;
    }
    setError(null);
    const maxSpeakersRaw = maxSpeakersInput.trim();
    const maxSpeakers =
      maxSpeakersRaw.length > 0 ? Number(maxSpeakersRaw) : undefined;
    if (
      maxSpeakersRaw.length > 0 &&
      (!Number.isInteger(maxSpeakers) || (maxSpeakers ?? 0) < 1)
    ) {
      setError("说话人上限须为正整数，或留空表示不限制");
      return;
    }
    try {
      parseTranscriptionUploadInitBody({
        title: title.trim(),
        fileName: file.name,
        mimeType,
        sizeBytes: BigInt(file.size),
        maxSpeakers,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message ?? "表单校验失败");
        return;
      }
      setError(toApiClientError(err).message);
      return;
    }
    try {
      await upload(file, { title: title.trim(), maxSpeakers });
    } catch (err) {
      setError(toApiClientError(err).message);
    }
  }, [file, title, maxSpeakersInput, upload]);

  useEffect(() => {
    if (!open && isUploading) {
      abort();
    }
  }, [open, isUploading, abort]);

  const accept = ALLOWED_TRANSCRIPTION_MIME_TYPES.join(",");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">新建转写</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建语音转写</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="transcription-title">任务名称</Label>
            <Input
              id="transcription-title"
              value={title}
              disabled={isUploading}
              placeholder="例如：客户会议录音"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="transcription-max-speakers">说话人上限（可选）</Label>
            <Input
              id="transcription-max-speakers"
              type="number"
              min={1}
              max={32}
              value={maxSpeakersInput}
              disabled={isUploading}
              placeholder="留空表示不限制"
              onChange={(e) => setMaxSpeakersInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              用于说话人分离；不填则由识别服务自行判断人数。
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="transcription-file">媒体文件</Label>
            <Input
              id="transcription-file"
              ref={fileInputRef}
              type="file"
              accept={accept}
              disabled={isUploading}
              onChange={(e) => {
                handleFileChange(e.target.files?.[0] ?? null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              支持 MP3、M4A、WAV、MP4；单文件最大 {formatMaxSize()}
            </p>
          </div>
          {isUploading && file ? (
            <UploadProgressBar progress={progress} fileName={file.name} />
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => handleOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={isUploading || !file || !title.trim()}
            onClick={() => void startUpload()}
          >
            {isUploading ? "上传中…" : "开始上传"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
