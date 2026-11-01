import { expect, test, type Page } from "@playwright/test";

const IDENTITY = "matrix(1, 0, 0, 1, 0, 0)";
const HIDDEN_HEADER = /matrix\(1, 0, 0, 1, 0, -\d+(\.\d+)?\)/;
const SHOWN_HEADER = /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/;
const INK = "rgb(241, 236, 228)";

/** Hydration done (`motion-ready`) and, when motion is allowed, Lenis running — controllers attach in that window. */
async function ready(page: Page) {
  await page.waitForSelector("html.motion-ready");
  await page.waitForFunction(() => {
    const cl = document.documentElement.classList;
    return !cl.contains("motion-ok") || cl.contains("lenis");
  });
}

const scrollToY = (page: Page, y: number) => page.evaluate((top) => window.scrollTo(0, top), y);

/** Document y at which an element's "top 85%" reveal start line is reached. */
const revealLine = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.85);

test("header hides on scroll down, returns on scroll up, turns solid after the hero", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel-driven");
  await page.goto("/");
  await ready(page);
  const header = page.locator("[data-site-header]");
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1400);
  await expect(header).toHaveAttribute("data-solid", "true");
  await expect(header).toHaveCSS("transform", HIDDEN_HEADER);
  await page.mouse.wheel(0, -300);
  await expect(header).toHaveCSS("transform", IDENTITY);
});

test("a hidden header comes back when focus enters it and stays while focus is inside", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel-driven");
  await page.goto("/");
  await ready(page);
  const header = page.locator("[data-site-header]");
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1400);
  await expect(header).toHaveCSS("transform", HIDDEN_HEADER);
  // preventScroll: a focus that scrolls would re-run the scroll rule and show the header without the focus handling.
  await page.getByRole("button", { name: "Open menu" }).evaluate((el) => el.focus({ preventScroll: true }));
  await expect(header).toHaveCSS("transform", IDENTITY);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1700);
  await page.waitForTimeout(500);
  await expect(header).toHaveCSS("transform", IDENTITY);
});

test("a header hidden on one page is shown, and not solid, at the top of the next", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel-driven");
  await page.goto("/");
  await ready(page);
  const header = page.locator("[data-site-header]");
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1400);
  await expect(header).toHaveCSS("transform", HIDDEN_HEADER);
  await expect(header).toHaveAttribute("data-solid", "true");
  await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Disclaimer" }).click();
  await expect(page).toHaveURL(/\/disclaimer$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(header).toHaveCSS("transform", SHOWN_HEADER);
  await expect(header).toHaveAttribute("data-solid", "false");
});

/** Scroll down far enough to hide the header, then up a little so it comes back and the burger can be clicked. */
async function scrollDownThenShowHeader(page: Page) {
  const header = page.locator("[data-site-header]");
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1400);
  // Let the smooth scroll settle first: a wheel-up sent mid-scroll only lowers a target the page has not reached yet.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1350);
  await expect(header).toHaveCSS("transform", HIDDEN_HEADER);
  await page.mouse.wheel(0, -300);
  await expect(header).toHaveCSS("transform", IDENTITY);
}

test("after the menu is closed with the pointer, the header hides on scroll down again", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel-driven");
  await page.goto("/");
  await ready(page);
  const header = page.locator("[data-site-header]");
  const burger = page.getByRole("button", { name: "Open menu" });
  await scrollDownThenShowHeader(page);
  await burger.click();
  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(page.locator("#site-menu")).toHaveCSS("visibility", "hidden");
  await expect(burger).toBeFocused(); // focus still returns to the burger (Task 6), just not as keyboard focus
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 600);
  await expect(header).toHaveCSS("transform", HIDDEN_HEADER);
});

test("after Escape closes the menu, the header stays while keyboard focus is on the burger", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel-driven");
  await page.goto("/");
  await ready(page);
  const header = page.locator("[data-site-header]");
  const burger = page.getByRole("button", { name: "Open menu" });
  await scrollDownThenShowHeader(page);
  await burger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-menu")).toHaveCSS("visibility", "hidden");
  await expect(burger).toBeFocused();
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 400);
  await page.waitForTimeout(500);
  await expect(header).toHaveCSS("transform", IDENTITY); // M11: never hidden while (keyboard) focus is inside
});

for (const from of ["above", "inside", "below"] as const) {
  test(`the menu's "How we work" link lands at the start of the pinned process from ${from} it`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "the pin is desktop-only");
    await page.goto("/");
    await ready(page);
    await expect(page.locator(".pin-spacer [data-process]")).toHaveCount(1);
    const header = page.locator("[data-site-header]");
    const section = page.locator("[data-process]");
    const pinStart = await page.locator(".pin-spacer").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const vh = page.viewportSize()!.height;
    if (from !== "above") {
      const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      await scrollToY(page, from === "inside" ? pinStart + vh : max);
      await expect(header).toHaveCSS("transform", HIDDEN_HEADER);
      await page.mouse.move(720, 450);
      await page.mouse.wheel(0, -200); // bring the header (and its burger) back
      await expect(header).toHaveCSS("transform", IDENTITY);
    }
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "How we work" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    // section[id] { scroll-margin-top: 96px }: the section sits 96 px down, just before the pin starts, on step 1.
    await expect.poll(() => section.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(96);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - (pinStart - 96))).toBeLessThanOrEqual(1);
    const steps = await page.locator("[data-step]").evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
    expect(steps).toEqual([1, 0.35, 0.35, 0.35]);
    const progress = await page.locator("[data-process-progress]").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(progress).toBeLessThan(0.01);
  });
}

test("process section pins on desktop only", async ({ page }, testInfo) => {
  await page.goto("/");
  await ready(page);
  if (testInfo.project.name === "desktop") {
    await expect(page.locator(".pin-spacer [data-process]")).toHaveCount(1);
  } else {
    // The mobile branch ran (steps wait for their reveal) and did not pin.
    await expect(page.locator("[data-step]").first()).toHaveCSS("opacity", "0");
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
  }
});

test("the pinned process holds the section and scrubs through its steps", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the pin is desktop-only");
  await page.goto("/");
  await ready(page);
  await expect(page.locator(".pin-spacer [data-process]")).toHaveCount(1);
  const section = page.locator("[data-process]");
  const start = await section.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const vh = page.viewportSize()!.height;
  const steps = () => page.locator("[data-step]").evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
  const top = () => section.evaluate((el) => Math.round(el.getBoundingClientRect().top));
  const progress = () => page.locator("[data-process-progress]").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);

  await scrollToY(page, start + 10);
  await expect.poll(steps).toEqual([1, 0.35, 0.35, 0.35]);
  expect(await progress()).toBeLessThan(0.05);

  // end: "+=200%" — progress 0.375 of the pin is step 2's stretch (timeline time 1.125 of 3).
  await scrollToY(page, start + vh * 0.75);
  await expect.poll(steps).toEqual([0.35, 1, 0.35, 0.35]);
  expect(await top()).toBe(0);

  await scrollToY(page, start + vh * 2 - 10);
  await expect.poll(steps).toEqual([0.35, 0.35, 0.35, 1]);
  expect(await top()).toBe(0);
  expect(await progress()).toBeGreaterThan(0.95);
});

test("reveals below the pinned process fire when they reach the viewport, not before", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the pin is desktop-only");
  await page.goto("/");
  await ready(page);
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await expect(page.locator(".pin-spacer [data-process]")).toHaveCount(1);
  await expect(page.locator("#contact-title > div > div").first()).toBeAttached(); // split triggers exist (after fonts)
  await page.waitForTimeout(300);

  // A trigger measured without the 200 % pin spacer would start ~1800 px early and have fired at the "before" position.
  const opacity = () => page.locator("#partners-title").evaluate((el) => getComputedStyle(el).opacity);
  const partners = await revealLine(page, "#partners-title");
  await scrollToY(page, partners - 300);
  await page.waitForTimeout(600);
  expect(await opacity()).toBe("0");
  await scrollToY(page, partners + 300);
  await expect.poll(opacity).toBe("1");

  // Split headings are created after fonts are ready, after the pin: same check on the contact heading's lines.
  const linesMoving = () =>
    page.$$eval("#contact-title > div > div", (els) =>
      els.filter((el) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(el).transform)).length,
    );
  const contact = await revealLine(page, "#contact-title");
  await scrollToY(page, contact - 300);
  await page.waitForTimeout(600);
  expect(await linesMoving()).toBeGreaterThan(0);
  await scrollToY(page, contact + 300);
  await expect.poll(linesMoving).toBe(0);
});

test("before hydration the process steps already sit where their motion starts, and show if it never comes", async ({ page }, testInfo) => {
  // Client JS never loads: the inline boot script still sets `motion-ok`, but no controller runs. This is what a visitor
  // sees between first paint and hydration, so it must match the controller's start state, or the steps paint in their
  // final state and then jump.
  await page.route(/\/_next\/static\/.+\.js(\?|$)/, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/\bmotion-ok\b/); // still inside the boot script's 4 s window
  const state = () =>
    page.locator("[data-step]").evaluateAll((els) =>
      els.map((el) => {
        const body = el.querySelector("[data-step-body]")!;
        const y = (node: Element) => Math.round(new DOMMatrix(getComputedStyle(node).transform).f);
        return { step: getComputedStyle(el).opacity, stepY: y(el), body: getComputedStyle(body).opacity, bodyY: y(body) };
      }),
    );
  if (testInfo.project.name === "desktop") {
    // ProcessMotion's pinned branch: step 1 active, the others dimmed with their bodies hidden 16 px down.
    expect(await state()).toEqual([
      { step: "1", stepY: 0, body: "1", bodyY: 0 },
      { step: "0.35", stepY: 0, body: "0", bodyY: 16 },
      { step: "0.35", stepY: 0, body: "0", bodyY: 16 },
      { step: "0.35", stepY: 0, body: "0", bodyY: 16 },
    ]);
  } else {
    // The unpinned branch: every step waits for its M3 reveal, 24 px down.
    expect(await state()).toEqual(Array(4).fill({ step: "0", stepY: 24, body: "1", bodyY: 0 }));
  }
  // The boot script's safety net: no hydration within 4 s drops `motion-ok`, and the steps show in full.
  await expect(page.locator("html")).not.toHaveClass(/\bmotion-ok\b/, { timeout: 8000 });
  expect(await state()).toEqual(Array(4).fill({ step: "1", stepY: 0, body: "1", bodyY: 0 }));
});

test("on mobile the process steps reveal as they scroll in", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the unpinned branch is mobile-only");
  await page.goto("/");
  await ready(page);
  const steps = () => page.locator("[data-step]").evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
  await expect.poll(steps).toEqual(["0", "0", "0", "0"]);
  const last = await revealLine(page, "[data-step]:last-of-type");
  for (let y = 0; y < last; y += 400) {
    await scrollToY(page, y);
    await page.waitForTimeout(100);
  }
  await scrollToY(page, last + 200);
  await expect.poll(steps).toEqual(["1", "1", "1", "1"]);
});

test("reduced motion never pins", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await ready(page); // motion-ready is set after every controller's mount effect has run
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  const dimmed = await page
    .locator("[data-step], [data-step-body]")
    .evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== "1").length);
  expect(dimmed).toBe(0);
});

test("service rows respond to hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "hover needs a fine pointer");
  await page.goto("/");
  await ready(page);
  const row = page.locator(".svc-row").first();
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await expect(row.locator(".svc-title")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 8, 0)");
  await expect(row.locator(".svc-arrow")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 4, 0)");
  await expect(row.locator(".svc-summary")).toHaveCSS("color", INK);
  await expect.poll(() => row.evaluate((el) => getComputedStyle(el, "::before").opacity)).toBe("1");
});

// Spec G2 / §7.6. As the page scrolls under a resting pointer, each service row or partner card on the way past would
// start its hover transitions. Lenis marks the root with `lenis-scrolling` while it scrolls; hover styles wait for it to
// settle.
test("hover effects wait until a smooth scroll settles", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "hover needs a fine pointer");
  await page.goto("/");
  await ready(page);
  const row = page.locator(".svc-row").first();
  const card = page.locator(".partner-card").first();
  const rowWash = () => row.evaluate((el) => getComputedStyle(el, "::before").opacity);
  const underline = () => card.locator(".partner-name").evaluate((el) => getComputedStyle(el, "::after").transform);
  // Stands in for a Lenis scroll: the root carries `lenis-scrolling` until released. Lenis rewrites its root classes
  // whenever its own scroll state changes (a native scroll, then 400 ms later its end), so the class is held: an observer
  // puts it back before the next style recalc.
  const scrolling = (on: boolean) =>
    page.evaluate((value) => {
      const root = document.documentElement;
      const w = window as unknown as { __hold?: MutationObserver };
      w.__hold?.disconnect();
      root.classList.toggle("lenis-scrolling", value);
      if (!value) return;
      // Only when missing: classList.add rewrites the attribute even when the class is there, which would re-trigger.
      w.__hold = new MutationObserver(() => {
        if (!root.classList.contains("lenis-scrolling")) root.classList.add("lenis-scrolling");
      });
      w.__hold.observe(root, { attributes: true, attributeFilter: ["class"] });
    }, on);
  const hovered = (locator: typeof row) => locator.evaluate((el) => el.matches(":hover"));

  // Lenis clears its own native-scroll state 400 ms after the last scroll event.
  const settle = async () => {
    await page.waitForTimeout(600);
    await expect(page.locator("html")).not.toHaveClass(/lenis-scrolling/);
  };
  await row.scrollIntoViewIfNeeded();
  await settle();
  await scrolling(true);
  await row.hover();
  await page.waitForTimeout(400); // twice the 200 ms hover transition
  expect(await hovered(row)).toBe(true);
  await expect(page.locator("html")).toHaveClass(/lenis-scrolling/);
  expect(await rowWash()).toBe("0");
  await expect(row.locator(".svc-title")).toHaveCSS("transform", "none");
  await expect(row.locator(".svc-summary")).not.toHaveCSS("color", INK);
  await scrolling(false);
  await expect.poll(rowWash).toBe("1");
  await expect(row.locator(".svc-title")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 8, 0)");
  await expect(row.locator(".svc-summary")).toHaveCSS("color", INK);

  await card.scrollIntoViewIfNeeded();
  await settle();
  await scrolling(true);
  await card.hover();
  await page.waitForTimeout(400);
  expect(await hovered(card)).toBe(true);
  expect(await underline()).toBe("matrix(0, 0, 0, 1, 0, 0)");
  await scrolling(false);
  await expect.poll(underline).toBe(IDENTITY);
});

test("service rows mirror the hover on keyboard focus", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const rows = page.locator(".svc-row");
  await expect(rows.first().locator(".svc-arrow")).toHaveCSS("transform", /matrix\(0\.70\d*, -0\.70\d*, 0\.70\d*, 0\.70\d*, 0, 0\)/);
  await rows.nth(1).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(rows.first()).toBeFocused();
  await expect(rows.first().locator(".svc-title")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 8, 0)");
  await expect(rows.first().locator(".svc-arrow")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 4, 0)");
  await expect(rows.first().locator(".svc-summary")).toHaveCSS("color", INK);
});

test("partner names underline on hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "hover needs a fine pointer");
  await page.goto("/");
  await ready(page);
  const card = page.locator(".partner-card").first();
  const underline = () => card.locator(".partner-name").evaluate((el) => getComputedStyle(el, "::after").transform);
  await card.scrollIntoViewIfNeeded();
  expect(await underline()).toBe("matrix(0, 0, 0, 1, 0, 0)");
  await card.hover();
  await expect.poll(underline).toBe(IDENTITY);
});

test("the contact call button leans toward the pointer, at most 8 px, and settles back", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "magnetic needs a fine pointer");
  await page.goto("/");
  await ready(page);
  const magnet = page.locator("[data-magnetic]");
  await magnet.scrollIntoViewIfNeeded();
  await expect(magnet.locator("xpath=..")).toHaveCSS("transform", IDENTITY); // its reveal block has settled
  const box = (await magnet.boundingBox())!;
  const offset = () => magnet.evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { x: Math.round(m.e * 100) / 100, y: Math.round(m.f * 100) / 100 };
  });
  expect(await offset()).toEqual({ x: 0, y: 0 });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2, { steps: 4 });
  await expect.poll(async () => (await offset()).x).toBeGreaterThan(2);
  await page.waitForTimeout(400);
  const pulled = await offset();
  expect(pulled.x).toBeLessThanOrEqual(8);
  expect(pulled.y).toBeGreaterThan(0);
  expect(pulled.y).toBeLessThanOrEqual(8);
  // M10 "max 8 px" is the length of the pull: near a corner both axes pull, and together they must not exceed it.
  expect(Math.hypot(pulled.x, pulled.y)).toBeLessThanOrEqual(8.01);
  await page.mouse.move(box.x - 200, box.y - 200, { steps: 4 });
  await expect.poll(offset).toEqual({ x: 0, y: 0 });
});

// M13 "arrow nudge x 4 px": the call button's arrow and the hero corner box's arrow, on hover (fine pointer) and focus.
const NUDGED = "matrix(1, 0, 0, 1, 4, 0)";
const arrows = (page: Page) => ({
  call: page.locator("#contact a[href^='tel:'] .arrow-nudge"),
  corner: page.locator("[data-hero] a[href='#contact'] .arrow-nudge"),
});

test("link arrows nudge 4 px on hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "hover needs a fine pointer");
  await page.goto("/");
  await ready(page);
  const { call, corner } = arrows(page);
  await expect(corner).toHaveCSS("transform", "none");
  await page.locator("[data-hero] a[href='#contact']").hover();
  await expect(corner).toHaveCSS("transform", NUDGED);
  const button = page.locator("#contact a[href^='tel:']");
  await button.scrollIntoViewIfNeeded();
  await expect(call).toHaveCSS("transform", "none");
  await button.hover();
  await expect(call).toHaveCSS("transform", NUDGED);
});

test("link arrows nudge on keyboard focus too, and stay put under reduced motion", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const { call } = arrows(page);
  await page.locator("#contact a[href^='tel:']").focus();
  await expect(call).toHaveCSS("transform", NUDGED);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(call).toHaveCSS("transform", "none");
});

test("reduced motion keeps the header in place and hovers to colour only", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel and hover need a fine pointer");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await ready(page);
  const header = page.locator("[data-site-header]");
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1400);
  await expect(header).toHaveAttribute("data-solid", "true");
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(400);
  await expect(header).toHaveCSS("transform", "none");

  const row = page.locator(".svc-row").first();
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await expect(row.locator(".svc-summary")).toHaveCSS("color", INK);
  await expect(row.locator(".svc-title")).toHaveCSS("transform", "none");

  const magnet = page.locator("[data-magnetic]");
  await magnet.scrollIntoViewIfNeeded();
  const box = (await magnet.boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2, { steps: 4 });
  await page.waitForTimeout(400);
  await expect(magnet).toHaveCSS("transform", "none");
});
