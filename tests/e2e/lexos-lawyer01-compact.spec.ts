import { expect, test, type Page } from "@playwright/test";

const password = "111111";
const changedPassword = "11111111";

async function login(page: Page, username: string) {
  await page.goto("/");
  await expect(page.locator("#username")).toBeVisible();

  async function submitLogin(currentPassword: string) {
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(currentPassword);
    await page.getByRole("button", { name: /Lexos/ }).click();
    await page.waitForTimeout(1000);
  }

  async function completePasswordChangeIfNeeded() {
    const newPasswordInput = page.locator("#newPassword");

    if (!(await newPasswordInput.isVisible({ timeout: 1000 }).catch(() => false))) {
      return false;
    }

    await newPasswordInput.fill(changedPassword);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);
    return true;
  }

  await submitLogin(password);

  if (!(await completePasswordChangeIfNeeded()) && (await page.locator("#username").isVisible({ timeout: 1000 }).catch(() => false))) {
    await submitLogin(changedPassword);
    await completePasswordChangeIfNeeded();
  }

  await expect(page.locator("aside nav button").first()).toBeVisible();
}

async function dashboardMetrics(page: Page) {
  return page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const failedAssets = Array.from(document.querySelectorAll<HTMLImageElement>("img"))
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src);
    const visibleTables = Array.from(document.querySelectorAll("table")).filter(isVisible).length;
    const desktopMenuButtons = Array.from(document.querySelectorAll("aside nav button")).filter(isVisible);
    const mobileMenuButtons = Array.from(document.querySelectorAll(".overflow-x-auto button")).filter(isVisible);

    return {
      bodyHeight: document.body.scrollHeight,
      clientWidth: document.documentElement.clientWidth,
      desktopMenuCount: desktopMenuButtons.length,
      failedAssets,
      mobileMenuCount: mobileMenuButtons.length,
      scrollWidth: document.documentElement.scrollWidth,
      visibleTables,
    };
  });
}

test.describe("lawyer01 compact dashboard", () => {
  test("shows functional menu and dense personal overview on desktop and mobile", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await login(page, "lawyer01");

    const desktop = await dashboardMetrics(page);
    expect(desktop.desktopMenuCount, "desktop sidebar menu should be populated").toBeGreaterThanOrEqual(6);
    expect(desktop.scrollWidth, "desktop should not scroll horizontally").toBeLessThanOrEqual(desktop.clientWidth + 1);
    expect(desktop.failedAssets, "desktop should not have failed image assets").toEqual([]);
    expect(desktop.visibleTables, "compact lawyer overview should not be table-led").toBe(0);
    expect(desktop.bodyHeight, "desktop lawyer overview should fit as a compact workbench").toBeLessThanOrEqual(1320);

    await page.setViewportSize({ width: 390, height: 844 });

    const mobile = await dashboardMetrics(page);
    expect(mobile.mobileMenuCount, "mobile menu should be populated").toBeGreaterThanOrEqual(6);
    expect(mobile.scrollWidth, "mobile should not scroll horizontally").toBeLessThanOrEqual(mobile.clientWidth + 1);
    expect(mobile.failedAssets, "mobile should not have failed image assets").toEqual([]);
    expect(mobile.visibleTables, "mobile compact overview should not be table-led").toBe(0);
    expect(mobile.bodyHeight, "mobile lawyer overview should remain reasonably compact").toBeLessThanOrEqual(2200);
  });
});
