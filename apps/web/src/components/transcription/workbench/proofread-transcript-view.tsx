"use client";

/** ASR 段落块（与 Worker `AsrRawJson` 对齐）。 */
export interface AsrProofreadSegment {
  readonly segmentIndex: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly text: string;
  readonly speakerLabel?: string | null;
}

export interface ProofreadTranscriptViewProps {
  readonly asrRawJson: unknown | null;
  readonly onSeek: (startMs: number) => void;
}

function parseAsrSegments(asrRawJson: unknown | null): readonly AsrProofreadSegment[] {
  if (!asrRawJson || typeof asrRawJson !== "object") {
    return [];
  }
  const segments = (asrRawJson as { segments?: unknown }).segments;
  if (!Array.isArray(segments)) {
    return [];
  }
  return segments
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      const text = typeof record.text === "string" ? record.text.trim() : "";
      const startMs = Number(record.startMs);
      if (!text || !Number.isFinite(startMs)) {
        return null;
      }
      return {
        segmentIndex:
          typeof record.segmentIndex === "number" ? record.segmentIndex : index,
        startMs,
        endMs: Number.isFinite(Number(record.endMs))
          ? Number(record.endMs)
          : startMs,
        text,
        speakerLabel:
          typeof record.speakerLabel === "string" ? record.speakerLabel : null,
      };
    })
    .filter((item): item is AsrProofreadSegment => item !== null);
}

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 校对模式只读视图（`asr_raw_json` · §4.3.4）。 */
export function ProofreadTranscriptView({
  asrRawJson,
  onSeek,
}: ProofreadTranscriptViewProps) {
  const segments = parseAsrSegments(asrRawJson);

  if (segments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">暂无可校对的时间戳段落</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {segments.map((segment) => {
        const label = formatTimestamp(segment.startMs);
        const speaker = segment.speakerLabel?.trim();
        const accessibleName = speaker
          ? `${speaker} ${label}：${segment.text}`
          : `${label}：${segment.text}`;
        return (
          <button
            key={`${segment.segmentIndex}-${segment.startMs}`}
            type="button"
            className="transcript-proofread-segment"
            data-start-ms={segment.startMs}
            aria-label={accessibleName}
            onClick={() => onSeek(segment.startMs)}
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
