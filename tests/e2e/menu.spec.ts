import { expect, test, type Page } from "@playwright/test";

/** Hydration done (`motion-ready`) and, when motion is allowed, Lenis running — controllers attach in that window. */
async function ready(page: Page) {
  await page.waitForSelector("html.motion-ready");
  await page.waitForFunction(() => {
    const cl = document.documentElement.classList;
    return !cl.contains("motion-ok") || cl.contains("lenis");
  });
}

/**
 * For checks that count animation frames. The e2e browser renders WebGL in software (SwiftShader, on the CPU): while the
 * live 3D hero mounts (long main-thread tasks) and renders, the page gets few, irregular frames. With WebGL unavailable
 * the hero takes its poster tier and mounts no canvas, so the count measures only the animation under test.
 */
async function withoutWebGL(page: Page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type.startsWith("webgl") ? null : Reflect.apply(getContext, this, [type, ...rest]);
    } as typeof getContext;
  });
}

/** The trap's own notion of the menu's focusable items, last one first in line for Shift+Tab wrapping. */
const lastMenuItem = (page: Page) => page.getByRole("dialog", { name: "Site menu" }).locator("a[href], button").last();

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

async function openMenuAndClickBlank(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  // clip-path clips hit-testing too: until the wipe has finished, a click low on the screen lands on the page behind.
  await expect.poll(() => page.locator("#site-menu").evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/^(none|inset\(0(px|%)?\))$/);
  await clickBlank(page);
}

/** Right edge, mid-height: inside the overlay, clear of every link and button. Focus lands on the dialog itself. */
async function clickBlank(page: Page) {
  const { width, height } = page.viewportSize()!;
  await page.mouse.click(width - 8, height / 2);
  // Without this precondition the keyboard checks below could pass with focus still on a menu item.
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeFocused();
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
  await clickBlank(page);
  await page.keyboard.press("Shift+Tab");
  await expect(lastMenuItem(page)).toBeFocused();
});

test("Shift+Tab from the close button wraps to the last item", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastMenuItem(page)).toBeFocused();
});

test("the menu wipes open, settles its items, and reverses closed (M12)", async ({ page }) => {
  await withoutWebGL(page);
  await page.goto("/");
  await ready(page);
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-tier", "poster"); // no canvas competes for frames
  // Record every inline clip-path the overlay goes through: an animated wipe writes many, an instant toggle one or two.
  await page.evaluate(() => {
    const el = document.getElementById("site-menu")!;
    const w = window as unknown as { __clips: string[] };
    w.__clips = [];
    new MutationObserver(() => w.__clips.push(el.style.clipPath)).observe(el, { attributes: true, attributeFilter: ["style"] });
  });
  const clips = () => page.evaluate(() => new Set((window as unknown as { __clips: string[] }).__clips).size);
  const overlay = page.locator("#site-menu");

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(overlay).toHaveCSS("visibility", "visible");
  await expect.poll(() => overlay.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/^inset\(0(px|%)?\)$/);
  const settled = () =>
    page.$$eval("[data-menu-item]", (els) =>
      els.every((el) => {
        const cs = getComputedStyle(el);
        return cs.opacity === "1" && ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(cs.transform);
      }),
    );
  await expect.poll(settled).toBe(true);
  const opened = await clips();
  expect(opened).toBeGreaterThan(3);

  await page.keyboard.press("Escape");
  await expect(overlay).toHaveCSS("visibility", "hidden");
  expect(await clips()).toBeGreaterThan(opened + 3);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

test("closing the menu before its wipe has drawn a frame still hides it", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  // Open and close inside one task, so no animation frame runs in between (a fast double press, or a busy main thread
  // on first load). React flushes each discrete update in a microtask; awaiting a few of them lets its effects run.
  const openedInBetween = await page.evaluate(async () => {
    const flush = async () => {
      for (let i = 0; i < 10; i++) await Promise.resolve();
    };
    const overlay = document.getElementById("site-menu")!;
    document.querySelector<HTMLButtonElement>("[aria-controls='site-menu']")!.click();
    await flush();
    const opened = overlay.style.visibility === "visible";
    overlay.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();
    return opened;
  });
  expect(openedInBetween).toBe(true);
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

test("the burger turns into an X while the menu is open, in 200 ms (M12)", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const burger = page.getByRole("button", { name: "Open menu" });
  const topLine = () =>
    burger.locator(".burger-lines").evaluate((el) => {
      const cs = getComputedStyle(el, "::before");
      return { transform: cs.transform, duration: cs.transitionDuration };
    });
  const BURGER = "matrix(1, 0, 0, 1, 0, -4)"; // translateY(-4px)
  const X = /^matrix\(0\.707\d*, 0\.707\d*, -0\.707\d*, 0\.707\d*, 0, 0\)$/; // rotate(45deg)
  expect(await topLine()).toEqual({ transform: BURGER, duration: "0.2s" });
  await burger.click();
  await expect.poll(async () => (await topLine()).transform).toMatch(X);
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await topLine()).transform).toBe(BURGER);
});

for (const mode of ["smooth scroll", "reduced motion"] as const) {
  test(`the page behind the open menu does not scroll (${mode})`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "wheel-driven");
    if (mode === "reduced motion") await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await ready(page);
    const scrollY = () => page.evaluate(() => window.scrollY);
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    expect(await scrollY()).toBe(0);

    await page.keyboard.press("Escape");
    await expect(page.locator("#site-menu")).toHaveCSS("visibility", "hidden");
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
    await page.mouse.wheel(0, 600);
    await expect.poll(scrollY).toBeGreaterThan(0); // the lock is released, so the check above was not vacuous
  });
}

test("under reduced motion a menu link still reaches its section", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Partners" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#partners")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});
