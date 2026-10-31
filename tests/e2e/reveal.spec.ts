import { expect, test, type Page } from "@playwright/test";

/** Waits for hydration (`motion-ready`) and, when motion is allowed, for Lenis — controllers attach in that window. */
async function ready(page: Page) {
  await page.waitForSelector("html.motion-ready");
  await page.waitForFunction(() => {
    const cl = document.documentElement.classList;
    return !cl.contains("motion-ok") || cl.contains("lenis");
  });
}

async function scrollThroughPage(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);
}

const notFullyVisible = (selector: string) => (els: Element[]) =>
  els.filter((el) => getComputedStyle(el).opacity !== "1").map((el) => `${selector}: ${el.textContent?.slice(0, 30)}`);

const hiddenSplitCount = (page: Page) =>
  page.$$eval("[data-split]", (els) => els.filter((el) => getComputedStyle(el).visibility === "hidden").length);

test("every revealed element ends fully visible after scrolling", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await scrollThroughPage(page);
  expect(await page.$$eval("[data-reveal]", notFullyVisible("[data-reveal]"))).toEqual([]);
  expect(await hiddenSplitCount(page)).toBe(0);
});

test("reduced motion shows everything immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.$$eval("[data-reveal], [data-hero-fade]", notFullyVisible("reduced"))).toEqual([]);
  expect(await hiddenSplitCount(page)).toBe(0);
});

test("hero headline finishes its intro within the 1.2 s budget", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.waitForTimeout(1300);
  // Guard against a vacuous pass: a headline that never started (still hidden, never split) has nothing "moving" either.
  expect(await page.locator("#hero-title").evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
  expect(await page.locator("#hero-title > div > div").count()).toBe(2);
  const moving = await page.$$eval("#hero-title *", (els) =>
    els.filter((el) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(el).transform)).length,
  );
  expect(moving).toBe(0);
});

test("the hero eyebrow, sub and header fade in after fonts are ready", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.waitForTimeout(1500);
  const states = await page.$$eval("[data-site-header], .hero-copy > p, a.hero-corner", (els) =>
    els.map((el) => `${el.tagName}.${el.className.split(" ")[0]}:${getComputedStyle(el).opacity}`),
  );
  expect(states.filter((s) => !s.endsWith(":1"))).toEqual([]);
});

test("the hero copy drifts up and fades as the hero scrolls out", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.waitForTimeout(1500);
  const opacity = () => page.locator(".hero-copy").evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(await opacity()).toBe(1);
  // 60 % of the hero height is the end of the scrub.
  await page.evaluate(() => window.scrollTo(0, document.querySelector<HTMLElement>("[data-hero]")!.offsetHeight * 0.7));
  await expect.poll(opacity).toBeLessThan(0.05);
});

test("practice statement words light up while scrolling and end fully lit", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const words = page.locator("#practice p[data-split='words-scrub'] div");
  await expect(words.first()).toBeAttached();
  expect(await words.count()).toBeGreaterThan(3);
  // Before the statement enters the viewport its words are dimmed.
  const before = await words.evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
  expect(Math.max(...before)).toBeLessThan(0.5);
  await scrollThroughPage(page);
  const after = await words.evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
  expect(Math.min(...after)).toBe(1);
});

test("split text keeps its words available to assistive technology", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.waitForTimeout(500);
  // Headings get an aria-label (their line wrappers are aria-hidden); running text must not be hidden behind one.
  await expect(page.locator("#hero-title")).toHaveAttribute("aria-label", "Clarity, line by line.");
  const statement = page.locator("#practice p[data-split='words-scrub']");
  await expect(statement).not.toHaveAttribute("aria-label", /.+/);
  expect(await statement.locator("[aria-hidden='true']").count()).toBe(0);
});

test("the disclaimer page reveals its heading and paragraphs", async ({ page }) => {
  await page.goto("/disclaimer");
  await ready(page);
  await scrollThroughPage(page);
  expect(await page.$$eval("[data-reveal]", notFullyVisible("[data-reveal]"))).toEqual([]);
  expect(await page.$$eval("[data-reveal]", (els) => els.length)).toBeGreaterThan(0);
  expect(await hiddenSplitCount(page)).toBe(0);
});

test("controllers re-run after a client-side navigation", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Disclaimer" }).click();
  await expect(page).toHaveURL(/\/disclaimer$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(500);
  await scrollThroughPage(page);
  expect(await page.$$eval("[data-reveal]", notFullyVisible("[data-reveal]"))).toEqual([]);
  expect(await page.$$eval("[data-reveal]", (els) => els.length)).toBeGreaterThan(0);
  expect(await hiddenSplitCount(page)).toBe(0);
  // The footer wordmark was split again for the new page and its characters ended up in place.
  const wordmarkMoving = await page.$$eval("footer [data-split='chars'] *", (els) =>
    els.filter((el) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(el).transform)).length,
  );
  expect(wordmarkMoving).toBe(0);
});

test("headline line masks reach below the line box so descenders are not clipped", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.waitForTimeout(1500);
  // h1 line-height is 0.94: a plain `overflow: clip` mask would shave the tail of the "y" in "Clarity," and "by".
  const masks = await page.$$eval("#hero-title > div", (els) =>
    els.map((el) => {
      const cs = getComputedStyle(el);
      return { overflow: cs.overflow, clipPath: cs.clipPath };
    }),
  );
  expect(masks).toHaveLength(2);
  for (const m of masks) {
    expect(m.overflow).toBe("visible");
    expect(m.clipPath).toMatch(/^inset\(0px 0px -\d+(\.\d+)?px\)$/);
  }
});
