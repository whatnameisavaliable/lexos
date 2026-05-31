import path from "node:path";
import { test, expect } from "@playwright/test";
import { loginAsLawyer } from "./fixtures/auth";
import { getE2ePassword, hasE2eCredentials, isWebReady } from "./fixtures/env";

const sampleAudio = path.join(
  import.meta.dirname,
  "fixtures",
  "test-audio.sample.mp3",
);

/**
 * 转写上传 happy path：init → TUS（Mock）→ complete → 列表见 queued。
 */
test.describe("transcription upload happy path", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() || !(await isWebReady(request)),
      "E2E credentials or web server unavailable",
    );
  });

  test("uploads sample mp3 and shows queued task", async ({
    page,
    request,
  }) => {
    await page.route("**/storage/v1/upload/**", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({ status: 204, body: "" });
        return;
      }
      await route.fulfill({
        status: 201,
        headers: { " tus-resumable": "1.0.0", location: "https://mock/upload/1" },
        body: "",
      });
    });

    const password = getE2ePassword();
    const username = process.env.E2E_LAWYER_USERNAME ?? "lawyer";
    await loginAsLawyer(page, request, username, password);

    await page.goto("/transcription");
    await page.getByRole("button", { name: "新建转写" }).click();

    const title = `E2E Upload ${Date.now()}`;
    await page.getByLabel("任务标题").fill(title);
    await page.locator('input[type="file"]').setInputFiles(sampleAudio);
    await page.getByRole("button", { name: "开始上传" }).click();

    await expect(page.getByText("queued").or(page.getByText("排队"))).toBeVisible({
      timeout: 60_000,
    });
  });
});
