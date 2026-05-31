import { test, expect } from "@playwright/test";
import { loginAsLawyer } from "./fixtures/auth";
import { getE2ePassword, hasE2eCredentials, isWebReady } from "./fixtures/env";

/**
 * 导出 Word 返回可下载响应。
 */
test.describe("workbench export docx", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() ||
        !(await isWebReady(request)) ||
        !process.env.E2E_WORKBENCH_TASK_ID,
      "Requires E2E_WORKBENCH_TASK_ID",
    );
  });

  test("export docx triggers downloadable response", async ({
    page,
    request,
  }) => {
    const taskId = process.env.E2E_WORKBENCH_TASK_ID as string;
    const password = getE2ePassword();
    const username = process.env.E2E_LAWYER_USERNAME ?? "lawyer";
    const session = await loginAsLawyer(page, request, username, password);

    const exportRes = await request.get(
      `/api/transcription/tasks/${taskId}/export/docx`,
      {
        headers: { authorization: `Bearer ${session.accessToken}` },
      },
    );
    expect(exportRes.ok()).toBeTruthy();
    const contentType = exportRes.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/word|octet-stream|officedocument/i);
    const buffer = await exportRes.body();
    expect(buffer.byteLength).toBeGreaterThan(100);
  });
});
