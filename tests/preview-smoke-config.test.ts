import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const configSource = readFileSync("playwright.preview.config.ts", "utf8");

describe("Preview smoke Playwright config", () => {
  it("writes a stable JSON report for deployment evidence", () => {
    assert.match(configSource, /LEXOS_PREVIEW_SMOKE_REPORT_PATH/);
    assert.match(configSource, /reports\/preview-smoke\/results\.json/);
    assert.match(configSource, /\["json", \{ outputFile: previewSmokeReportPath \}\]/);
  });

  it("uses the remote Preview URL from LEXOS_PREVIEW_BASE_URL", () => {
    assert.match(configSource, /process\.env\.LEXOS_PREVIEW_BASE_URL/);
    assert.match(configSource, /baseURL/);
  });
});
