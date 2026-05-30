/** 导出用文稿段落（标题 / 摘要 / 正文）。 */
export interface TranscriptExportSections {
  readonly title: string;
  readonly summaryText: string | null;
  readonly polishedText: string | null;
}

/** 去除简单 HTML 标签，保留可读纯文本。 */
export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function readSegmentText(record: Record<string, unknown>): string {
  return typeof record.text === "string" ? record.text.trim() : "";
}

/** 从 `asr_raw_json.segments` 拼接 ASR 纯文本（LLM 未完成时的导出回退）。 */
export function extractAsrPlainText(asrRawJson: unknown | null): string {
  if (!asrRawJson || typeof asrRawJson !== "object") {
    return "";
  }
  const segments = (asrRawJson as { segments?: unknown }).segments;
  if (!Array.isArray(segments)) {
    return "";
  }
  return segments
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }
      return readSegmentText(item as Record<string, unknown>);
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/**
 * 解析导出正文：优先 LLM 润色/摘要；正文缺失时回退 ASR 源稿。
 */
export function resolveTranscriptExportSections(input: {
  readonly title: string;
  readonly polishedText: string | null;
  readonly summaryText: string | null;
  readonly asrRawJson?: unknown | null;
}): TranscriptExportSections {
  const summaryText = stripHtml(input.summaryText ?? "");
  let polishedText = stripHtml(input.polishedText ?? "");
  if (!polishedText) {
    polishedText = extractAsrPlainText(input.asrRawJson ?? null);
  }

  return {
    title: input.title.trim(),
    summaryText: summaryText || null,
    polishedText: polishedText || null,
  };
}
