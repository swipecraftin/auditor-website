import { expect, test, type Page } from "@playwright/test";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test.describe("home page", () => {
  test("renders hero, facts, practice and services without errors", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Clarity,\s*line by line\./);
    await expect(page.getByText("ICAI firm registration")).toBeVisible();
    await expect(page.locator("#practice")).toBeVisible();
    await expect(page.locator("#services h3")).toHaveCount(5);
    await expect(page.locator('#services a[href="#contact"]')).toHaveCount(5);
    expect(errors).toEqual([]);
  });

  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe("tablet width", () => {
  test.use({ viewport: { width: 768, height: 1024 } });
  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});
