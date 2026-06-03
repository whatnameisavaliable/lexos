"use client";

import { buildIframeSrcdoc } from "@/lib/build-iframe-srcdoc";

/** iframe 沙盒属性（禁止 `allow-scripts`）。 */
export const SOP_HTML_IFRAME_SANDBOX = "allow-same-origin";

export interface SopHtmlIframePreviewProps {
  readonly html: string;
  readonly className?: string;
}

/** HTML 沙盒预览（`srcDoc` + 无脚本沙盒）。 */
export function SopHtmlIframePreview({ html, className }: SopHtmlIframePreviewProps) {
  return (
    <iframe
      title="SOP HTML 预览"
      sandbox={SOP_HTML_IFRAME_SANDBOX}
      srcDoc={buildIframeSrcdoc(html)}
      className={className ?? "h-full min-h-[400px] w-full border-0 bg-white"}
    />
  );
}
