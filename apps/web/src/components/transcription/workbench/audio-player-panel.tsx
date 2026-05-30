"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPlaybackDownloadUrl } from "@/lib/transcription-api";
import { toApiClientError } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/** 音频播放器对外控制接口。 */
export interface AudioPlayerControls {
  /** 跳转到指定毫秒位置并尝试播放。 */
  seek(ms: number): void;
}

export interface AudioPlayerPanelProps {
  readonly taskId: string;
  readonly disabled?: boolean;
  /** 播放器就绪后注册 seek 控制（比 imperative ref 更可靠）。 */
  readonly onControlsReady?: (controls: AudioPlayerControls | null) => void;
  /** 播放进度回调（毫秒）。 */
  readonly onTimeUpdate?: (currentMs: number) => void;
}

/** 左列音频播放器（Flex 列 · `ui_design.md` §4.3.3）。 */
export function AudioPlayerPanel({
  taskId,
  disabled = false,
  onControlsReady,
  onTimeUpdate,
}: AudioPlayerPanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playbackKind, setPlaybackKind] = useState<"audio" | "source" | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seekToMs = useCallback((ms: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(ms)) {
      return;
    }

    const targetSec = Math.max(0, ms / 1000);

    const applySeek = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = Math.min(targetSec, Math.max(0, audio.duration - 0.05));
      } else {
        audio.currentTime = targetSec;
      }
      void audio.play().catch(() => undefined);
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      applySeek();
      return;
    }

    audio.addEventListener("loadedmetadata", applySeek, { once: true });
    audio.load();
  }, []);

  useEffect(() => {
    if (loading || error || !src) {
      onControlsReady?.(null);
      return;
    }
    onControlsReady?.({ seek: seekToMs });
    return () => onControlsReady?.(null);
  }, [loading, error, src, seekToMs, onControlsReady]);

  useEffect(() => {
    let cancelled = false;
    async function loadAudio() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPlaybackDownloadUrl(taskId);
        if (!cancelled) {
          setSrc(result.signedUrl);
          setPlaybackKind(result.kind);
        }
      } catch (err) {
        if (!cancelled) {
          setError(toApiClientError(err).message);
          setSrc(null);
          setPlaybackKind(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    if (!disabled) {
      void loadAudio();
    } else {
      setLoading(false);
      setSrc(null);
    }
    return () => {
      cancelled = true;
    };
  }, [taskId, disabled]);

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <audio
        ref={audioRef}
        className="w-full"
        controls
        preload="auto"
        src={src ?? undefined}
        onTimeUpdate={(event) => {
          const current = event.currentTarget.currentTime;
          if (Number.isFinite(current)) {
            onTimeUpdate?.(Math.floor(current * 1000));
          }
        }}
      />
      <p className="text-xs text-muted-foreground">
        {playbackKind === "source"
          ? "当前播放原始上传文件（抽音文件不可用）；校对模式下点击右侧 ASR 段落可跳转"
          : "校对模式下点击右侧 ASR 源稿段落可跳转播放位置"}
      </p>
    </div>
  );
}
