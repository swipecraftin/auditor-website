import { expect, test } from "@playwright/test";

test("disclaimer page renders the full text", async ({ page }) => {
  await page.goto("/disclaimer");
  await expect(page.getByRole("heading", { level: 1, name: "Disclaimer" })).toBeVisible();
  await expect(page.locator("main p[data-reveal]")).toHaveCount(3);
  await expect(page).toHaveTitle(/Disclaimer · Firm Name & Co\./);
});
