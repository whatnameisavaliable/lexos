import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ExportAdapter, TranscriptExportInput } from "./export.adapter.js";

/**
 * 由 `polished_text` / `summary_text` 生成 DOCX 缓冲（`tasks.md` M6-C）。
 */
export class DocxExportAdapter implements ExportAdapter {
  /** @inheritdoc */
  async generate(input: TranscriptExportInput): Promise<Buffer> {
    const children: Paragraph[] = [
      new Paragraph({
        text: input.title,
        heading: HeadingLevel.TITLE,
      }),
    ];

    if (input.summaryText?.trim()) {
      children.push(
        new Paragraph({
          text: "摘要",
          heading: HeadingLevel.HEADING_1,
        }),
        ...splitLinesToParagraphs(input.summaryText),
      );
    }

    if (input.polishedText?.trim()) {
      children.push(
        new Paragraph({
          text: "正文",
          heading: HeadingLevel.HEADING_1,
        }),
        ...splitLinesToParagraphs(input.polishedText),
      );
    }

    const doc = new Document({
      sections: [{ children }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }
}

function splitLinesToParagraphs(text: string): Paragraph[] {
  return text.split(/\r?\n/).map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line)],
      }),
  );
}
