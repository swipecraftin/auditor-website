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

type HeroTiming = { visibleAt?: number; settledAt?: number };

// The budget runs from the moment the headline becomes visible (fonts ready + split done, h1 `visibility: visible`) to the
// moment every line wrapper sits at its identity transform. Anchoring at the reveal itself (not at "fonts loaded" plus a
// fixed wait) keeps hydration and controller start-up out of the 1.2 s: fonts are often ready 0.3–0.9 s before hydration.
// Both instants are the style writes themselves (a MutationObserver runs right after the script that wrote them), not the
// next animation frame that happens to sample them: under the e2e software renderer one frame can take several hundred
// ms, and a frame-sampled clock would add that to the measurement.
test("hero headline finishes its intro within 1.2 s of becoming visible", async ({ page }) => {
  await page.addInitScript(() => {
    const state: HeroTiming = {};
    (window as unknown as { __hero: HeroTiming }).__hero = state;
    const identity = ["none", "matrix(1, 0, 0, 1, 0, 0)"];
    const observer = new MutationObserver(() => {
      const title = document.getElementById("hero-title");
      // Split and made visible in the same task, so "visible with line wrappers" is the reveal instant. Requiring the
      // wrappers keeps an unsplit headline (nothing transformed) from counting as an instantly finished intro.
      const lines = title ? [...title.querySelectorAll(":scope > div > div")] : [];
      if (lines.length === 0) return;
      if (state.visibleAt === undefined && getComputedStyle(title!).visibility === "visible") state.visibleAt = performance.now();
      if (state.visibleAt !== undefined && lines.every((el) => identity.includes(getComputedStyle(el).transform))) {
        state.settledAt = performance.now();
        observer.disconnect();
      }
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
  });
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __hero: HeroTiming }).__hero.settledAt !== undefined);
  const { visibleAt, settledAt } = await page.evaluate(() => (window as unknown as { __hero: HeroTiming }).__hero);
  expect(await page.locator("#hero-title > div > div").count()).toBe(2); // split into its two lines, not left unsplit
  test.info().annotations.push({ type: "intro-ms", description: (settledAt! - visibleAt!).toFixed(1) });
  expect(settledAt! - visibleAt!).toBeLessThan(1200);
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

const IDENTITY = ["none", "matrix(1, 0, 0, 1, 0, 0)"];

/** Revealed-state violations among reveal/split elements that start inside the first viewport (no scrolling happens). */
const unrevealedAboveTheFold = (page: Page) =>
  page.evaluate((identity) => {
    const fold = window.innerHeight * 0.8; // clear of the 85 % trigger line so boundary rounding cannot matter
    const problems: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (el.getBoundingClientRect().top >= fold) continue;
      const cs = getComputedStyle(el);
      if (cs.opacity !== "1" || !identity.includes(cs.transform)) problems.push(`reveal ${el.tagName} ${cs.opacity} ${cs.transform}`);
    }
    for (const el of document.querySelectorAll<HTMLElement>("[data-split]:not([data-split='words-scrub'])")) {
      if (el.getBoundingClientRect().top >= fold) continue;
      if (getComputedStyle(el).visibility !== "visible") problems.push(`split ${el.tagName} hidden`);
      for (const part of el.querySelectorAll("*")) {
        const transform = getComputedStyle(part).transform;
        if (!identity.includes(transform)) problems.push(`split ${el.tagName} part ${transform}`);
      }
    }
    for (const el of document.querySelectorAll<HTMLElement>("[data-line]")) {
      if (el.getBoundingClientRect().top >= fold) continue;
      const transform = getComputedStyle(el).transform;
      if (!identity.includes(transform)) problems.push(`line ${transform}`);
    }
    return problems;
  }, IDENTITY);

test("the disclaimer page is fully revealed at load, without scrolling", async ({ page }) => {
  await page.goto("/disclaimer");
  await ready(page);
  await page.waitForFunction(() => document.fonts.status === "loaded");
  // Everything on this page starts above the fold, so nothing should be waiting for a scroll.
  await expect.poll(() => unrevealedAboveTheFold(page), { timeout: 8000 }).toEqual([]);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const headingLines = await page.$$eval("main h1 > div > div", (els) => els.map((el) => getComputedStyle(el).transform));
  expect(headingLines).toHaveLength(1);
  expect(headingLines.filter((t) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(t))).toEqual([]);
  expect(await page.locator("main [data-reveal]").count()).toBeGreaterThan(0);
  expect(await page.$$eval("[data-reveal]", notFullyVisible("[data-reveal]"))).toEqual([]);
});

test("the home page reveals what starts above the fold at load, without scrolling", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await expect.poll(() => unrevealedAboveTheFold(page), { timeout: 8000 }).toEqual([]);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.locator("#hero-title > div > div").count()).toBe(2);
});

test("a tall first viewport reveals every section that starts inside it, without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 2600 });
  await page.goto("/");
  await ready(page);
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await expect.poll(() => unrevealedAboveTheFold(page), { timeout: 10000 }).toEqual([]);
  // The tall viewport must actually have put reveal elements and split text in view, or the test proves nothing.
  // At 1280 × 2600 that is the Practice and Services headings, three service rows, their hairlines, the four fact values,
  // the hero headline and the Practice statement.
  const inView = await page.evaluate(() => {
    const count = (selector: string) =>
      [...document.querySelectorAll(selector)].filter((el) => el.getBoundingClientRect().top < innerHeight * 0.8).length;
    return { reveals: count("[data-reveal]"), splits: count("[data-split]"), lines: count("[data-line]") };
  });
  expect(inView.reveals).toBeGreaterThanOrEqual(5);
  expect(inView.splits).toBeGreaterThan(3);
  expect(inView.lines).toBeGreaterThan(0);
});

// document.fonts.ready is replaced by a promise the test settles by hand, so the callbacks the controllers queued on it
// are still pending when the route changes. Settling afterwards must only affect the controller that is now mounted:
// a stale one would split the new page's heading a second time (PageMotion), or tween hero elements the new page does not
// have, which GSAP reports as a missing target (HeroMotion).
test("a fonts.ready callback queued before a route change does not run against the new route", async ({ page }) => {
  const missingTargets: string[] = [];
  page.on("console", (message) => {
    if (/target .* not found/i.test(message.text())) missingTargets.push(message.text());
  });
  await page.addInitScript(() => {
    type Probe = { releaseFonts: () => void; maskAdds: number };
    const probe: Probe = { releaseFonts: () => {}, maskAdds: 0 };
    (window as unknown as { __probe: Probe }).__probe = probe;
    const resolvers: Array<() => void> = [];
    probe.releaseFonts = () => resolvers.splice(0).forEach((resolve) => resolve());
    Object.defineProperty(document.fonts, "ready", {
      configurable: true,
      get: () => new Promise<FontFaceSet>((resolve) => resolvers.push(() => resolve(document.fonts))),
    });
    new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.classList.contains("split-line-mask")) probe.maskAdds += 1;
        });
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/");
  await ready(page);
  await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Disclaimer" }).click();
  await expect(page).toHaveURL(/\/disclaimer$/);
  await expect(page.locator("main h1")).toBeAttached();
  await page.waitForTimeout(300); // the new route's controller has queued its own fonts.ready callback by now
  // Fonts really are loaded (only the ready promise is held back), so SplitText's autoSplit has no `loadingdone`
  // re-split to add a mask of its own after the release.
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.evaluate(() => (window as unknown as { __probe: { releaseFonts: () => void } }).__probe.releaseFonts());
  await page.waitForTimeout(500);
  // "Disclaimer" is one line, so a single split adds exactly one line mask. Two means the stale callback split it too.
  expect(await page.evaluate(() => (window as unknown as { __probe: { maskAdds: number } }).__probe.maskAdds)).toBe(1);
  expect(await page.locator("main h1 > div > div").count()).toBe(1);
  expect(missingTargets).toEqual([]);
});
