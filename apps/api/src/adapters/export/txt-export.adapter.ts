import type { ExportAdapter, TranscriptExportInput } from "./export.adapter.js";

/**
 * 纯文本导出（`tasks.md` M6-C）。
 */
export class TxtExportAdapter implements ExportAdapter {
  /** @inheritdoc */
  async generate(input: TranscriptExportInput): Promise<Buffer> {
    const sections: string[] = [input.title, ""];

    if (input.summaryText) {
      sections.push("【摘要】", input.summaryText, "");
    }

    if (input.polishedText) {
      sections.push("【正文】", input.polishedText);
    }

    return Buffer.from(sections.join("\n"), "utf-8");
  }
}
