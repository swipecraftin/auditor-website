import { expect, test, type Page } from "@playwright/test";

// Lenis 1.3 puts the bare `lenis` class on <html> (plus lenis-smooth / lenis-scrolling / ... modifiers).
// `\blenis\b` would also match `lenis-stopped`, so match the bare class token only.
const LENIS_CLASS = /(^|\s)lenis(\s|$)/;

/** Hydration done (`motion-ready`) and, when motion is allowed, Lenis running. */
async function ready(page: Page) {
  await page.waitForSelector("html.motion-ready");
  await page.waitForFunction(() => {
    const cl = document.documentElement.classList;
    return !cl.contains("motion-ok") || cl.contains("lenis");
  });
}

/**
 * How far (px) a section sits from where a hash jump must put it: its scroll-margin-top below the viewport top, or, for a
 * section too close to the page end to reach that line, as high as the maximum scroll allows. 0 = landed exactly.
 */
const landingError = (page: Page, id: string) =>
  page.locator(`#${id}`).evaluate((el) => {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const top = el.getBoundingClientRect().top;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const expected = Math.max(margin, top + window.scrollY - max);
    return Math.round(Math.abs(top - expected));
  });

/** Lands within 2 px of its line, and is still there after any late re-measure (fonts, split headings, the pin). */
async function expectLanded(page: Page, id: string) {
  await expect.poll(() => landingError(page, id)).toBeLessThanOrEqual(2);
  await page.waitForTimeout(800);
  expect(await landingError(page, id)).toBeLessThanOrEqual(2);
}

/** Document y at which an element's "top 85%" reveal start line is reached. */
const revealLine = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.85);

/** Lines of the split contact heading that are still masked or moving (0 = revealed). */
const contactLinesMoving = (page: Page) =>
  page.$$eval("#contact-title > div > div", (els) =>
    els.filter((el) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(el).transform)).length,
  );

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
  // Lenis flags ANY scroll (even a native one) as `lenis-scrolling`; only a Lenis-driven scroll adds `lenis-smooth`.
  // Let the native scroll above settle first so it cannot bleed into the probe.
  await expect(html).not.toHaveClass(/lenis-scrolling/);
  await page.evaluate(() => {
    const w = window as unknown as { __marker?: string; __sawSmooth?: boolean };
    w.__marker = "same-document";
    w.__sawSmooth = false;
    new MutationObserver(() => {
      if (document.documentElement.classList.contains("lenis-smooth")) w.__sawSmooth = true;
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
  await expect(page.locator("html")).toHaveClass(LENIS_CLASS); // hydrated: the smooth-scroll handler takes the click
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  // The handler moves focus in a setTimeout(0) (R16); a Tab sent within the same few milliseconds can beat it.
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("main");
  await page.keyboard.press("Tab");
  // Native fragment navigation moves the focus starting point into <main>; a preventDefault'd smooth scroll must keep that.
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("main")))).toBe(true);
});

test("keyboard activation of an in-page link moves focus to its section", async ({ page }) => {
  await page.goto("/");
  await page.locator("a.hero-corner").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contact")).toBeInViewport();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id))
    .toBe("contact");
});

test("under reduced motion, keyboard activation of an in-page link still moves focus to its section", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await ready(page); // hydrated: the click handler is attached
  await page.locator("a.hero-corner").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contact")).toBeInViewport();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("contact");
});

test("a menu link hands focus to its section, not back to the menu button", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Partners" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  // The menu's own close effect focuses the burger; the target section must win.
  await expect(page.locator("#partners")).toBeFocused();
});

/** Desktop: the pinned process still holds and scrubs. Back up into it: step 2 is active, the section held at the top. */
async function expectPinScrubs(page: Page) {
  await expect(page.locator(".pin-spacer [data-process]")).toHaveCount(1);
  const pinStart = await page.locator(".pin-spacer").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const y = pinStart + page.viewportSize()!.height * 0.75; // progress 0.375 of the "+=200%" pin: step 2's stretch
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await expect
    .poll(() => page.locator("[data-step]").evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity))))
    .toEqual([0.35, 1, 0.35, 0.35]);
  expect(await page.locator("[data-process]").evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(0);
}

test.describe("hash links from another page", () => {
  test("a menu link lands on its section, hands it focus, and leaves later reveals and the pin working", async ({ page }, testInfo) => {
    await page.goto("/disclaimer");
    await ready(page);
    await expect(page.locator("html")).toHaveClass(LENIS_CLASS);
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Partners" }).click();
    await expect(page).toHaveURL(/\/#partners$/);
    await expect(page.getByRole("dialog")).toBeHidden();
    await expectLanded(page, "partners");
    await expect(page.locator("#partners")).toBeFocused(); // R16: the section wins over the menu's burger refocus
    await expect.poll(() => page.locator("#partners-title").evaluate((el) => getComputedStyle(el).opacity)).toBe("1");

    // Triggers below the landing spot were measured on the new page (on desktop with the 200 % pin spacer): the contact
    // heading has not revealed early, and does once it is reached.
    await expect(page.locator("#contact-title > div > div").first()).toBeAttached();
    const contact = await revealLine(page, "#contact-title");
    expect(contact).toBeGreaterThan(await page.evaluate(() => window.scrollY)); // still below the reveal line here
    expect(await contactLinesMoving(page)).toBeGreaterThan(0);
    await page.evaluate((top) => window.scrollTo(0, top), contact + 300);
    await expect.poll(() => contactLinesMoving(page)).toBe(0);

    if (testInfo.project.name === "desktop") await expectPinScrubs(page);
  });

  test("the footer Contact link lands on the contact section and hands it focus", async ({ page }, testInfo) => {
    await page.goto("/disclaimer");
    await ready(page);
    await expect(page.locator("html")).toHaveClass(LENIS_CLASS);
    await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/#contact$/);
    await expectLanded(page, "contact");
    await expect(page.locator("#contact")).toBeFocused();
    await expect.poll(() => contactLinesMoving(page)).toBe(0); // its heading reveals where it landed

    if (testInfo.project.name === "desktop") await expectPinScrubs(page);
  });

  // The header decides hidden / solid from scroll updates. Landing on a section past the hero is a jump it must follow at
  // once (solid, and shown: the visitor just navigated), not on the first scroll after it.
  for (const mode of ["smooth scroll", "reduced motion"] as const) {
    test(`arriving past the hero turns the header solid and keeps it shown (${mode})`, async ({ page }) => {
      if (mode === "reduced motion") await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/disclaimer");
      await ready(page);
      const header = page.locator("[data-site-header]");
      await expect(header).toHaveAttribute("data-solid", "false"); // at the top of a hero-less page: the start state
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("dialog").getByRole("link", { name: "Partners" }).click();
      await expect(page).toHaveURL(/\/#partners$/);
      await expect(page.getByRole("dialog")).toBeHidden();
      await expectLanded(page, "partners"); // no scroll happens after this
      await expect(header).toHaveAttribute("data-solid", "true");
      await expect(header).toHaveCSS("transform", /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    });
  }

  for (const via of ["menu", "footer"] as const) {
    test(`under reduced motion, the ${via} link lands natively on its section`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "one reduced-motion run covers the native path");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/disclaimer");
      await ready(page);
      await expect(page.locator("html")).not.toHaveClass(LENIS_CLASS);
      const id = via === "menu" ? "partners" : "contact";
      if (via === "menu") {
        await page.getByRole("button", { name: "Open menu" }).click();
        await page.getByRole("dialog").getByRole("link", { name: "Partners" }).click();
        await expect(page.getByRole("dialog")).toBeHidden();
      } else {
        await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Contact" }).click();
      }
      await expect(page).toHaveURL(new RegExp(`/#${id}$`));
      await expectLanded(page, id);
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect(page.locator(".pin-spacer")).toHaveCount(0);
    });
  }
});
