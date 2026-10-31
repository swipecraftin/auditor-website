import { expect, test } from "@playwright/test";

// Lenis 1.3 puts the bare `lenis` class on <html> (plus lenis-smooth / lenis-scrolling / ... modifiers).
// `\blenis\b` would also match `lenis-stopped`, so match the bare class token only.
const LENIS_CLASS = /(^|\s)lenis(\s|$)/;

test("smooth scrolling is active when motion is allowed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel smoothing is a desktop concern");
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveClass(/\bmotion-ok\b/);
  await expect(html).toHaveClass(/\bmotion-ready\b/);
  await expect(html).toHaveClass(LENIS_CLASS);
});

test("reduced motion keeps native scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveClass(/\bmotion-ready\b/);
  await expect(html).not.toHaveClass(/\bmotion-ok\b/);
  await expect(html).not.toHaveClass(LENIS_CLASS);
});

test("in-page anchors scroll to their section and update the URL", async ({ page }) => {
  await page.goto("/");
  await page.locator("a.hero-corner").click();
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page).toHaveURL(/#contact$/);
});

test("a same-page next/link hash link is a smooth scroll, not a navigation", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveClass(LENIS_CLASS);
  // The footer "Contact" link is a next/link to /#contact.
  const link = page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Contact" });
  await link.scrollIntoViewIfNeeded();
  // Watch for Lenis animating: the browser's own hash jump is instant and never sets `lenis-scrolling`.
  await page.evaluate(() => {
    const w = window as unknown as { __marker?: string; __sawSmooth?: boolean };
    w.__marker = "same-document";
    w.__sawSmooth = false;
    new MutationObserver(() => {
      if (document.documentElement.classList.contains("lenis-scrolling")) w.__sawSmooth = true;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  });
  await link.click();
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page).toHaveURL(/#contact$/);
  const state = await page.evaluate(() => {
    const w = window as unknown as { __marker?: string; __sawSmooth?: boolean };
    return { marker: w.__marker, sawSmooth: w.__sawSmooth };
  });
  expect(state.marker).toBe("same-document"); // no full page navigation
  expect(state.sawSmooth).toBe(true); // Lenis (not the browser's instant jump) did the scrolling
});

test("smooth hash scrolls honour scroll-margin-top and land below the fixed header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Practice" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  // section[id] { scroll-margin-top: 96px } — the smooth scroll must stop 96px short of the section, like a native jump.
  await expect
    .poll(() => page.locator("#practice").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(96);
});

test("the skip link keeps its native focus behaviour", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  // Native fragment navigation moves the focus starting point into <main>; a preventDefault'd smooth scroll would not.
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("main")))).toBe(true);
});
