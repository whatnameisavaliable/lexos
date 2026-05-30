"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { getDownloadUrl } from "@/lib/transcription-api";
import { toApiClientError } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/** 音频播放器 seek 句柄。 */
export interface AudioPlayerHandle {
  /** 跳转到指定毫秒位置。 */
  seek(ms: number): void;
}

export interface AudioPlayerPanelProps {
  readonly taskId: string;
  readonly disabled?: boolean;
}

/** 左列音频播放器（Flex 列 · `ui_design.md` §4.3.3）。 */
export const AudioPlayerPanel = forwardRef<AudioPlayerHandle, AudioPlayerPanelProps>(
  function AudioPlayerPanel({ taskId, disabled = false }, ref) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      seek(ms: number) {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(ms)) {
          return;
        }
        audio.currentTime = Math.max(0, ms / 1000);
        void audio.play().catch(() => undefined);
      },
    }));

    useEffect(() => {
      let cancelled = false;
      async function loadAudio() {
        setLoading(true);
        setError(null);
        try {
          const result = await getDownloadUrl(taskId, "audio");
          if (!cancelled) {
            setSrc(result.signedUrl);
          }
        } catch (err) {
          if (!cancelled) {
            setError(toApiClientError(err).message);
            setSrc(null);
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
          preload="metadata"
          src={src ?? undefined}
        />
        <p className="text-xs text-muted-foreground">
          校对模式下点击右侧段落可跳转播放位置
        </p>
      </div>
    );
  },
);
