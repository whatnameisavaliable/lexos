"use client";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

export type SopHtmlPaperSize = "a4" | "a3";

export interface SopHtmlPreviewToolbarProps {
  readonly grayscale: boolean;
  readonly onGrayscaleChange: (value: boolean) => void;
  readonly paperSize: SopHtmlPaperSize;
  readonly onPaperSizeChange: (size: SopHtmlPaperSize) => void;
}

const PAPER_ASPECT: Record<SopHtmlPaperSize, string> = {
  a4: "210 / 297",
  a3: "297 / 420",
};

/** HTML 预览工具栏：黑白模式 + 纸张比例 + 出血框。 */
export function SopHtmlPreviewToolbar({
  grayscale,
  onGrayscaleChange,
  paperSize,
  onPaperSizeChange,
}: SopHtmlPreviewToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-2">
      <Toggle
        pressed={grayscale}
        onPressedChange={onGrayscaleChange}
        aria-label="黑白预览"
        size="sm"
      >
        黑白
      </Toggle>
      <Toggle
        pressed={paperSize === "a3"}
        onPressedChange={(pressed) => onPaperSizeChange(pressed ? "a3" : "a4")}
        aria-label="A3 纸张"
        size="sm"
      >
        A3
      </Toggle>
      <Toggle
        pressed={paperSize === "a4"}
        onPressedChange={(pressed) => onPaperSizeChange(pressed ? "a4" : "a3")}
        aria-label="A4 纸张"
        size="sm"
      >
        A4
      </Toggle>
    </div>
  );
}

export interface SopHtmlPreviewFrameProps {
  readonly children: React.ReactNode;
  readonly grayscale: boolean;
  readonly paperSize: SopHtmlPaperSize;
}

/** 纸张比例容器 + 红色虚线出血框。 */
export function SopHtmlPreviewFrame({
  children,
  grayscale,
  paperSize,
}: SopHtmlPreviewFrameProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl p-4",
        grayscale && "grayscale",
      )}
      style={{ filter: grayscale ? "grayscale(100%)" : undefined }}
    >
      <div
        className="relative w-full border bg-white shadow-sm"
        style={{ aspectRatio: PAPER_ASPECT[paperSize] }}
      >
        <div
          className="pointer-events-none absolute inset-3 border border-dashed border-red-400"
          aria-hidden
        />
        <div className="absolute inset-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
