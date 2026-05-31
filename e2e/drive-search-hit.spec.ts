import { test, expect } from "@playwright/test";
import { loginAsLawyer } from "./fixtures/auth";
import { getE2ePassword, hasE2eCredentials, isWebReady } from "./fixtures/env";

/**
 * 云盘检索命中转写正文关键词。
 */
test.describe("drive search hit", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() ||
        !(await isWebReady(request)) ||
        !process.env.E2E_DRIVE_SEARCH_KEYWORD,
      "Requires E2E_DRIVE_SEARCH_KEYWORD",
    );
  });

  test("drive search returns transcription keyword hit", async ({
    page,
    request,
  }) => {
    const keyword = process.env.E2E_DRIVE_SEARCH_KEYWORD as string;
    const password = getE2ePassword();
    const username = process.env.E2E_LAWYER_USERNAME ?? "lawyer";
    await loginAsLawyer(page, request, username, password);

    await page.goto("/drive");
    await page.getByPlaceholder(/搜索|检索/).fill(keyword);
    await page.getByRole("button", { name: /搜索|检索/ }).click();

    await expect(page.getByText(keyword).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
