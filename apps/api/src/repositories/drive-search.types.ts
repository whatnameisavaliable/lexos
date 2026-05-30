/** 全文检索命中摘要。 */
export interface DriveSearchHit {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly archiveFolderId: string | null;
  readonly matchedField: "polished_text" | "summary_text";
  readonly snippet: string;
  readonly score: number;
}

/** 全文检索分页参数。 */
export interface DriveSearchParams {
  readonly q: string;
  readonly limit: number;
  readonly cursor?: string;
}

/** 全文检索分页结果。 */
export interface DriveSearchResult {
  readonly items: readonly DriveSearchHit[];
  readonly nextCursor?: string;
}

/**
 * 编码检索游标（`score` + `taskId`）。
 */
export function encodeDriveSearchCursor(score: number, taskId: string): string {
  const payload = JSON.stringify({ score, taskId });
  return Buffer.from(payload, "utf8").toString("base64url");
}

/**
 * 解码检索游标。
 */
export function decodeDriveSearchCursor(
  cursor: string,
): { score: number; taskId: string } {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { score?: number; taskId?: string };
    if (typeof parsed.score !== "number" || typeof parsed.taskId !== "string") {
      throw new Error("Invalid drive search cursor");
    }
    return { score: parsed.score, taskId: parsed.taskId };
  } catch {
    throw new Error("Invalid drive search cursor");
  }
}

/**
 * 从正文中截取检索片段（前后各保留上下文）。
 */
export function buildSearchSnippet(
  text: string,
  query: string,
  radius = 40,
): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index < 0) {
    return text.slice(0, radius * 2).trim();
  }
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + query.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}
