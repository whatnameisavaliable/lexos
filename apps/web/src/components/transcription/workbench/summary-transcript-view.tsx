export interface SummaryTranscriptViewProps {
  readonly summaryText: string | null;
}

/** 法律摘要只读视图（`summary_text`）。 */
export function SummaryTranscriptView({ summaryText }: SummaryTranscriptViewProps) {
  if (!summaryText?.trim()) {
    return (
      <p className="text-sm text-muted-foreground">暂无法律摘要</p>
    );
  }

  return (
    <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
      {summaryText}
    </div>
  );
}
