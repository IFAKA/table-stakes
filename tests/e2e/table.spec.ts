import { expect, type Page, test } from "@playwright/test";

const viewports = [{ width: 225, height: 225 }, { width: 390, height: 844 }, { width: 430, height: 932 }];

async function startMatch(page: Page) {
  await page.goto("/");
  await expect(page.getByText("Pot").first()).toBeVisible();
}

async function expectContained(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  for (const button of await page.locator("button").all()) {
    const box = await button.boundingBox();
    if (box) expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  }
}

test("defaults start immediately and settings are optional", async ({ page }) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/");
  await expect(page.getByLabel("Heads-up Hold’em table")).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await page.goto("/settings/");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Table", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Players" })).toHaveCount(0);
  await expectContained(page, 225);
});

for (const viewport of viewports.slice(1)) {
  test(`keeps the two-sided table contract at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await startMatch(page);
    await expect(page.getByLabel("Player 1 side")).toHaveClass(/player-0/);
    await expect(page.getByLabel("Player 2 side")).toHaveClass(/player-1/);
    await expect(page.getByLabel("Player 2 side")).toHaveCSS("transform", "matrix(-1, 0, 0, -1, 0, 0)");
    await expect(page.locator(".center > .center-face")).toHaveCount(2);
    await expect(page.locator(".center-face-top")).toHaveCSS("transform", "matrix(-1, 0, 0, -1, 0, 0)");
    await expect(page.locator(".center-face-bottom")).toHaveCSS("transform", "none");
    await expectContained(page, viewport.width);

    await expect(page.getByLabel("Player 1 side").getByRole("button", { name: "Call 10" })).toBeVisible();
    await expect(page.getByLabel("Player 1 side").getByRole("button", { name: /Call 10/ })).toBeVisible();
    await page.getByLabel("Player 1 side").getByRole("button", { name: /Call 10/ }).click();
    await expect(page.getByLabel("Player 2 side").getByRole("button", { name: "Check" })).toBeVisible();
    await page.getByLabel("Player 2 side").getByRole("button", { name: "Raise" }).click();
    await expect(page.locator("dialog")).toHaveClass(/raise-panel-player-1/);
    await expect(page.locator("dialog")).toHaveCSS("transform", "matrix(-1, 0, 0, -1, 0, 0)");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog")).toBeHidden();
    await page.getByLabel("Player 2 side").getByRole("button", { name: "Check" }).click();
    await expect(page.locator(".center-face .center-button")).toHaveCount(1);
    await page.locator(".center-face-bottom .center-button").click();
    await page.getByLabel("Player 1 side").getByRole("button", { name: "Fold" }).click();
    await expect(page.locator(".physical").filter({ hasText: "wins" }).last()).toBeVisible();
    await expect(page.getByLabel("Player 1 side").locator(".outcome")).toHaveText("WON");
    await expect(page.getByLabel("Player 2 side").locator(".outcome")).toHaveText("LOST");
    await expect(page.getByRole("button", { name: /Start hand/ })).toBeVisible();
  });
}

test("renders the complete street and showdown flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startMatch(page);
  await page.getByLabel("Player 1 side").getByRole("button", { name: /Call 10/ }).click();
  await page.getByLabel("Player 2 side").getByRole("button", { name: "Check" }).click();
  for (const street of ["flop", "turn", "river"] as const) {
    await expect(page.getByRole("button", { name: new RegExp(`Deal ${street}`) })).toHaveCount(1);
    await page.locator(".center-face .center-button").click();
    await page.getByLabel("Player 1 side").getByRole("button", { name: "Check" }).click();
    await page.getByLabel("Player 2 side").getByRole("button", { name: "Check" }).click();
  }
  await expect(page.locator(".showdown button", { hasText: "Player 1 wins" })).toHaveCount(2);
  await page.locator(".center-face-bottom .showdown button", { hasText: "Player 1 wins" }).click();
  await expect(page.getByRole("button", { name: "Confirm Player 1 wins" })).toHaveCount(2);
  await page.locator(".center-face-bottom .showdown button", { hasText: "Confirm Player 1 wins" }).click();
  await expect(page.getByText("Player 1 wins").last()).toBeVisible();
  await page.getByRole("button", { name: "Start hand 2" }).click();
  await expect(page.getByText("Hand 02")).toBeVisible();
  await expectContained(page, 390);
});
