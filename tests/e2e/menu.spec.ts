import { expect, test } from "@playwright/test";

test("menu opens and closes with the keyboard and traps focus", async ({ page }) => {
  await page.goto("/");
  const burger = page.getByRole("button", { name: "Open menu" });
  await burger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Site menu" });
  await expect(dialog).toBeVisible();
  const close = page.getByRole("button", { name: "Close menu" });
  await expect(close).toBeFocused();
  // 9 focusable items: close + 6 links + phone + email → 9 tabs wrap back to close
  for (let i = 0; i < 9; i++) await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(burger).toBeFocused();
});

test("menu link closes the menu and reaches its section", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Partners" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#partners")).toBeInViewport();
});

async function openMenuAndClickBlank(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  // Right edge, mid-height: inside the overlay, clear of every link and button.
  const { width, height } = page.viewportSize()!;
  await page.mouse.click(width - 8, height / 2);
}

test("Escape closes the menu after clicking a blank area of the overlay", async ({ page }) => {
  await openMenuAndClickBlank(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

test("Tab and Shift+Tab stay in the menu after clicking a blank area of the overlay", async ({ page }) => {
  await openMenuAndClickBlank(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.mouse.click(page.viewportSize()!.width - 8, page.viewportSize()!.height / 2);
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("dialog").getByRole("link", { name: "office@firmname.in" })).toBeFocused();
});

test("Shift+Tab from the close button wraps to the last item", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("dialog").getByRole("link", { name: "office@firmname.in" })).toBeFocused();
});
