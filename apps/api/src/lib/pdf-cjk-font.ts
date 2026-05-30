import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import wawoff2 from "wawoff2";

const require = createRequire(import.meta.url);

const BUNDLED_NOTO_SANS_SC_WOFF2 = require.resolve(
  "@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2",
);

let cachedFontBuffer: Buffer | null = null;

/** PDF 导出用的 CJK 字体 TTF 缓冲（WOFF2 解压后供 PDFKit 正确嵌字）。 */
export async function loadPdfCjkFontBuffer(): Promise<Buffer> {
  if (cachedFontBuffer) {
    return cachedFontBuffer;
  }

  const override = process.env.PDF_CJK_FONT_PATH?.trim();
  if (override) {
    if (!existsSync(override)) {
      throw new Error(`PDF_CJK_FONT_PATH not found: ${override}`);
    }
    cachedFontBuffer = readFileSync(override);
    return cachedFontBuffer;
  }

  const woff2 = readFileSync(BUNDLED_NOTO_SANS_SC_WOFF2);
  cachedFontBuffer = Buffer.from(await wawoff2.decompress(woff2));
  return cachedFontBuffer;
}

/** @deprecated 测试兼容：返回 bundled 字体路径。 */
export function resolvePdfCjkFontPath(): string {
  return BUNDLED_NOTO_SANS_SC_WOFF2;
}
