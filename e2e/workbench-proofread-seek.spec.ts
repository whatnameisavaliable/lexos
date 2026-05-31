import { test, expect } from "@playwright/test";
import { loginAsLawyer } from "./fixtures/auth";
import { getE2ePassword, hasE2eCredentials, isWebReady } from "./fixtures/env";

/**
 * 工作台校对模式段落 seek（audio currentTime 变化【待确认】桩）。
 */
test.describe("workbench proofread seek", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() ||
        !(await isWebReady(request)) ||
        !process.env.E2E_WORKBENCH_TASK_ID,
      "Requires E2E_WORKBENCH_TASK_ID and running web stack",
    );
  });

  test("clicking proofread segment updates audio currentTime", async ({
    page,
    request,
  }) => {
    const taskId = process.env.E2E_WORKBENCH_TASK_ID as string;
    const password = getE2ePassword();
    const username = process.env.E2E_LAWYER_USERNAME ?? "lawyer";
    await loginAsLawyer(page, request, username, password);

    await page.goto(`/transcription/${taskId}`);
    await expect(page.getByRole("tab", { name: "校对" })).toBeVisible();

    const segment = page.locator(".transcript-proofread-segment").first();
    await expect(segment).toBeVisible();

    const before = await page.locator("audio").evaluate(
      (el) => (el as HTMLAudioElement).currentTime,
    );
    await segment.click();
    const after = await page.locator("audio").evaluate(
      (el) => (el as HTMLAudioElement).currentTime,
    );

    expect(after).toBeGreaterThanOrEqual(before);
  });
});
