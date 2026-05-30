export interface PrintPreviewPanelProps {
  readonly title: string;
  readonly polishedText: string | null;
  readonly summaryText: string | null;
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/** 打印/PDF 预览（语义化 HTML · §4.2）。 */
export function PrintPreviewPanel({
  title,
  polishedText,
  summaryText,
}: PrintPreviewPanelProps) {
  return (
    <article className="transcript-print-preview rounded-md border border-border bg-card p-4">
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
      </header>

      {summaryText?.trim() ? (
        <section className="mt-4">
          <h3 className="transcript-print-preview__section-title">摘要</h3>
          <div className="transcript-print-preview__body">{summaryText}</div>
        </section>
      ) : null}

      {polishedText?.trim() ? (
        <section className="mt-4">
          <h3 className="transcript-print-preview__section-title">正文</h3>
          <div className="transcript-print-preview__body">
            {stripHtml(polishedText)}
          </div>
        </section>
      ) : null}
    </article>
  );
}
