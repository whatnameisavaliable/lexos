"use client";

import { toast } from "sonner";
import {
  findActiveSegmentIndex,
  formatTranscriptTimestamp,
  parseAsrSegments,
} from "@/lib/asr-segments";

export interface ProofreadTranscriptViewProps {
  readonly asrRawJson: unknown | null;
  readonly onSeek: (startMs: number) => void;
  /** 当前播放位置（毫秒），用于高亮对应段落。 */
  readonly activePlaybackMs?: number;
}

/** 校对模式只读视图（`asr_raw_json` · §4.3.4）。 */
export function ProofreadTranscriptView({
  asrRawJson,
  onSeek,
  activePlaybackMs = 0,
}: ProofreadTranscriptViewProps) {
  const segments = parseAsrSegments(asrRawJson);
  const activeIndex = findActiveSegmentIndex(segments, activePlaybackMs);

  if (segments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">暂无可校对的时间戳段落</p>
    );
  }

  function handleSeek(startMs: number) {
    onSeek(startMs);
    toast.message(`已跳转到 ${formatTranscriptTimestamp(startMs)}`, {
      description:
        segments.length <= 1
          ? "当前任务仅有单段 ASR 结果，全文对应 00:00 起点"
          : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {segments.length === 1 ? (
        <p className="text-xs text-muted-foreground">
          当前为单段 ASR 源稿（无句级时间戳）；点击段落将跳转到{" "}
          {formatTranscriptTimestamp(segments[0]!.startMs)}
        </p>
      ) : null}
      {segments.map((segment, index) => {
        const label = formatTranscriptTimestamp(segment.startMs);
        const speaker = segment.speakerLabel?.trim();
        const accessibleName = speaker
          ? `${speaker} ${label}：${segment.text}`
          : `${label}：${segment.text}`;
        const isActive = activeIndex === index;
        return (
          <button
            key={`${segment.segmentIndex}-${segment.startMs}`}
            type="button"
            className={
              isActive
                ? "transcript-proofread-segment transcript-proofread-segment--active"
                : "transcript-proofread-segment"
            }
            data-start-ms={segment.startMs}
            aria-label={accessibleName}
            aria-current={isActive ? "true" : undefined}
            onClick={() => handleSeek(segment.startMs)}
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">{label}</span>
              {speaker ? <span>{speaker}</span> : null}
            </div>
            <p className="text-sm leading-7 text-foreground">{segment.text}</p>
          </button>
        );
      })}
    </div>
  );
}
