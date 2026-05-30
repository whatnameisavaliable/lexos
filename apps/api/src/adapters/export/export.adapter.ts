/**
 * 导出适配器通用输入（`tasks.md` M6-C）。
 */
export interface TranscriptExportInput {
  /** 任务标题（用于文档标题页）。 */
  readonly title: string;
  /** LLM 润色正文。 */
  readonly polishedText: string | null;
  /** LLM 法律摘要。 */
  readonly summaryText: string | null;
}

/** 导出适配器：生成二进制缓冲。 */
export interface ExportAdapter {
  /** 生成导出文件缓冲。 */
  generate(input: TranscriptExportInput): Promise<Buffer>;
}
