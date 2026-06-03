"use client";

import { useState } from "react";
import { DEFAULT_DEBOUNCE_MS, useDebouncedValue } from "@/hooks/use-debounced-value";
import { SopMonacoHtmlEditor } from "./sop-monaco-html-editor";
import { SopHtmlIframePreview } from "./sop-html-iframe-preview";
import {
  SopHtmlPreviewFrame,
  SopHtmlPreviewToolbar,
  type SopHtmlPaperSize,
} from "./sop-html-preview-toolbar";

export const SOP_HTML_PREVIEW_DEBOUNCE_MS = DEFAULT_DEBOUNCE_MS;

export interface SopArtifactHtmlSplitPaneProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly readOnly?: boolean;
}

/** HTML 双栏：Monaco + 防抖 iframe 预览。 */
export function SopArtifactHtmlSplitPane({
  value,
  onChange,
  readOnly = false,
}: SopArtifactHtmlSplitPaneProps) {
  const debouncedHtml = useDebouncedValue(value, SOP_HTML_PREVIEW_DEBOUNCE_MS);
  const [grayscale, setGrayscale] = useState(false);
  const [paperSize, setPaperSize] = useState<SopHtmlPaperSize>("a4");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SopMonacoHtmlEditor value={value} onChange={onChange} readOnly={readOnly} />
      <div className="flex flex-col gap-2">
        <SopHtmlPreviewToolbar
          grayscale={grayscale}
          onGrayscaleChange={setGrayscale}
          paperSize={paperSize}
          onPaperSizeChange={setPaperSize}
        />
        <SopHtmlPreviewFrame grayscale={grayscale} paperSize={paperSize}>
          <SopHtmlIframePreview html={debouncedHtml} />
        </SopHtmlPreviewFrame>
      </div>
    </div>
  );
}
