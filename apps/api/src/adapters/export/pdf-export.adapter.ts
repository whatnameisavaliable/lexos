import PDFDocument from "pdfkit";
import type { ExportAdapter, TranscriptExportInput } from "./export.adapter.js";

/**
 * 由 HTML/纯文本模板生成 PDF 缓冲（`tasks.md` M6-C · `ui_design.md` §4.2）。
 */
export class PdfExportAdapter implements ExportAdapter {
  /** @inheritdoc */
  async generate(input: TranscriptExportInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(18).text(input.title, { underline: true });
      doc.moveDown();

      if (input.summaryText?.trim()) {
        doc.fontSize(14).text("摘要", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(stripHtml(input.summaryText), {
          align: "left",
        });
        doc.moveDown();
      }

      if (input.polishedText?.trim()) {
        doc.fontSize(14).text("正文", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(stripHtml(input.polishedText), {
          align: "left",
        });
      }

      doc.end();
    });
  }
}

/** 去除简单 HTML 标签，保留可读纯文本。 */
function stripHtml(value: string): string {
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
