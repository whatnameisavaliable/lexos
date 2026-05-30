import PDFDocument from "pdfkit";
import { loadPdfCjkFontBuffer } from "../../lib/pdf-cjk-font.js";
import type { ExportAdapter, TranscriptExportInput } from "./export.adapter.js";

const PDF_CJK_FONT = "NotoSansSC";

/**
 * 由 HTML/纯文本模板生成 PDF 缓冲（`tasks.md` M6-C · `ui_design.md` §4.2）。
 */
export class PdfExportAdapter implements ExportAdapter {
  /** @inheritdoc */
  async generate(input: TranscriptExportInput): Promise<Buffer> {
    const fontBuffer = await loadPdfCjkFontBuffer();

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        doc.registerFont(PDF_CJK_FONT, fontBuffer);

        const contentWidth =
          doc.page.width - doc.page.margins.left - doc.page.margins.right;

        doc.font(PDF_CJK_FONT).fontSize(18).text(input.title, {
          width: contentWidth,
        });
        doc.moveDown();

        if (input.summaryText) {
          doc.font(PDF_CJK_FONT).fontSize(14).text("摘要", {
            width: contentWidth,
          });
          doc.moveDown(0.5);
          doc.font(PDF_CJK_FONT).fontSize(11).text(input.summaryText, {
            align: "left",
            width: contentWidth,
            lineGap: 4,
          });
          doc.moveDown();
        }

        if (input.polishedText) {
          doc.font(PDF_CJK_FONT).fontSize(14).text("正文", {
            width: contentWidth,
          });
          doc.moveDown(0.5);
          doc.font(PDF_CJK_FONT).fontSize(11).text(input.polishedText, {
            align: "left",
            width: contentWidth,
            lineGap: 4,
          });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
