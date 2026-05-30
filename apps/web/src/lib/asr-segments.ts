/** ASR 段落块（与 Worker `AsrRawJson` 对齐）。 */
export interface AsrProofreadSegment {
  readonly segmentIndex: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly text: string;
  readonly speakerLabel?: string | null;
}

function readStartMs(record: Record<string, unknown>): number {
  if (typeof record.startMs === "number" && Number.isFinite(record.startMs)) {
    return record.startMs;
  }
  if (typeof record.start_ms === "number" && Number.isFinite(record.start_ms)) {
    return record.start_ms;
  }
  return Number.NaN;
}

function readEndMs(record: Record<string, unknown>, startMs: number): number {
  if (typeof record.endMs === "number" && Number.isFinite(record.endMs)) {
    return record.endMs;
  }
  if (typeof record.end_ms === "number" && Number.isFinite(record.end_ms)) {
    return record.end_ms;
  }
  return startMs;
}

/**
 * 从 `asr_raw_json` 解析可 seek 的分段列表。
 */
export function parseAsrSegments(
  asrRawJson: unknown | null,
): readonly AsrProofreadSegment[] {
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
      const startMs = readStartMs(record);
      if (!text || !Number.isFinite(startMs)) {
        return null;
      }
      const endMs = readEndMs(record, startMs);
      return {
        segmentIndex:
          typeof record.segmentIndex === "number"
            ? record.segmentIndex
            : typeof record.segment_index === "number"
              ? record.segment_index
              : index,
        startMs,
        endMs: Number.isFinite(endMs) && endMs >= startMs ? endMs : startMs,
        text,
        speakerLabel:
          typeof record.speakerLabel === "string"
            ? record.speakerLabel
            : typeof record.speaker_label === "string"
              ? record.speaker_label
              : null,
      };
    })
    .filter((item): item is AsrProofreadSegment => item !== null);
}

/** 根据当前播放位置判断高亮分段索引。 */
export function findActiveSegmentIndex(
  segments: readonly AsrProofreadSegment[],
  currentMs: number,
): number | null {
  if (segments.length === 0 || !Number.isFinite(currentMs)) {
    return null;
  }
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (currentMs >= segments[i]!.startMs) {
      return i;
    }
  }
  return 0;
}

/** 格式化毫秒为 MM:SS。 */
export function formatTranscriptTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
