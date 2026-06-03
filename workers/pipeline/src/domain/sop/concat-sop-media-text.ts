import { formatMediaFilenameHeader } from "./format-media-filename-header.js";

/** 单卷宗文件 OCR/ASR 文本块。 */
export interface SopMediaTextChunk {
  readonly fileName: string;
  readonly text: string;
}

/**
 * 按上传顺序拼接多卷宗文本，供 Mustache 插槽 `{{sop_media_extracted_text}}` 使用（`prd.md` §3.8.4）。
 *
 * @param chunks - 按文件名排序后的文本块
 */
export function concatSopMediaText(
  chunks: readonly SopMediaTextChunk[],
): string {
  return chunks
    .map((chunk) => {
      const header = formatMediaFilenameHeader(chunk.fileName);
      const body = chunk.text.trim();
      return body.length > 0 ? `${header}\n${body}` : header;
    })
    .join("\n\n");
}
