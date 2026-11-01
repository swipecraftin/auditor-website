import { expect, test } from "@playwright/test";

test("live 3D hero picks its tier, renders and fades in", async ({ page }, testInfo) => {
  await page.goto("/");
  const hero = page.locator("[data-hero]");
  await expect(hero).toHaveAttribute("data-tier", testInfo.project.name === "desktop" ? "full" : "lite");
  await expect(hero).toHaveAttribute("data-hero-ready", "true", { timeout: 30_000 });
  await expect(page.locator("[data-hero] > .hero-canvas canvas")).toHaveCount(1);
});

test("the live hero stops drawing while it is scrolled out of view", async ({ page }) => {
  // Count WebGL draw calls (three draws its meshes with drawElements / drawElementsInstanced).
  await page.addInitScript(() => {
    const w = window as unknown as { __draws: number };
    w.__draws = 0;
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const methods = proto as unknown as Record<string, unknown>;
      for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
        const original = methods[name];
        if (typeof original !== "function") continue;
        methods[name] = function (this: unknown, ...args: unknown[]) {
          w.__draws++;
          return Reflect.apply(original, this, args);
        };
      }
    }
  });
  const draws = () => page.evaluate(() => (window as unknown as { __draws: number }).__draws);
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-hero-ready", "true", { timeout: 30_000 });
  const atTop = await draws();
  await expect.poll(draws).toBeGreaterThan(atTop); // rendering every frame while in view

  await page.evaluate(() => window.scrollTo(0, document.querySelector<HTMLElement>("[data-hero]")!.offsetHeight + 200));
  await page.waitForTimeout(1000); // the observer reports, and a frame already queued finishes
  const away = await draws();
  await page.waitForTimeout(1500);
  expect(await draws()).toBe(away); // paused off-screen (spec §6)

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(draws).toBeGreaterThan(away); // and resumes when the hero is back
});

test("the live hero stops drawing while the open menu covers it", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __draws: number };
    w.__draws = 0;
    const proto = WebGL2RenderingContext.prototype as unknown as Record<string, unknown>;
    for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
      const original = proto[name];
      if (typeof original !== "function") continue;
      proto[name] = function (this: unknown, ...args: unknown[]) {
        w.__draws++;
        return Reflect.apply(original, this, args);
      };
    }
  });
  const draws = () => page.evaluate(() => (window as unknown as { __draws: number }).__draws);
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-hero-ready", "true", { timeout: 30_000 });
  await expect.poll(draws).toBeGreaterThan(await draws());

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator("#site-menu")).not.toHaveAttribute("inert");
  await page.waitForTimeout(1000); // the 500 ms wipe, and a frame already queued finishes
  const covered = await draws();
  await page.waitForTimeout(1500);
  expect(await draws()).toBe(covered); // the opaque menu hides the hero: nothing to draw

  await page.keyboard.press("Escape");
  await expect.poll(draws).toBeGreaterThan(covered); // and it resumes as the menu closes
});

test("reduced motion uses the poster tier and never mounts a canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-tier", "poster");
  // Live tiers mount ~1.5 s after fonts are ready (after the headline intro), then at idle: wait longer than that.
  await page.waitForTimeout(4000);
  await expect(page.locator(".hero-canvas")).toHaveCount(0);
});

test("a WebGL1-only browser gets the poster tier (three r163+ needs WebGL2)", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type === "webgl2" ? null : Reflect.apply(getContext, this, [type, ...rest]);
    } as typeof getContext;
  });
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-tier", "poster");
  await page.waitForTimeout(4000); // longer than the live-tier mount delay
  await expect(page.locator(".hero-canvas")).toHaveCount(0);
  await expect(page.locator("#hero-title")).toBeVisible();
});

test("a renderer that fails to start falls back to the poster tier instead of crashing the page", async ({ page }) => {
  // The tier probe gets a real WebGL2 context; every later request (three's renderer) fails, as when a device's
  // context limit is hit or the requested attributes are refused.
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    let webgl2Calls = 0;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === "webgl2" && ++webgl2Calls > 1) return null;
      return Reflect.apply(getContext, this, [type, ...rest]);
    } as typeof getContext;
  });
  await page.goto("/");
  const hero = page.locator("[data-hero]");
  await expect(hero).toHaveAttribute("data-tier", /^(full|lite)$/); // the probe passed: a live tier was chosen
  await expect(hero).toHaveAttribute("data-tier", "poster", { timeout: 15_000 }); // and it degraded after the failure
  await expect(page.locator(".hero-canvas")).toHaveCount(0);
  // An uncaught render error replaces the whole route with Next's "This page couldn't load" screen, so the route's
  // own content still being there is the proof that the error stayed inside the hero.
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator("#process")).toBeAttached();
});

test("a dark scrim sits between the 3D stage and the hero copy, and stays out of the poster capture", async ({ page }) => {
  await page.goto("/");
  const scrim = page.locator("[data-hero] > .hero-scrim");
  await expect(scrim).toHaveCount(1);
  await expect(scrim).toHaveAttribute("aria-hidden", "true");
  await expect(scrim).toHaveCSS("pointer-events", "none");
  await expect(scrim).toHaveCSS("position", "absolute"); // out of flow: no layout shift
  expect(await scrim.evaluate((el) => getComputedStyle(el).backgroundImage)).toMatch(/radial-gradient/);
  // Paint order inside the hero's isolated stacking context: poster and canvas below the scrim, the copy (z auto) above.
  await expect(page.locator("[data-hero] > .hero-canvas")).toBeAttached({ timeout: 30_000 });
  const z = await page.evaluate(() => {
    const zOf = (selector: string) => Number(getComputedStyle(document.querySelector(selector)!).zIndex);
    return { poster: zOf("[data-hero] > .hero-poster"), canvas: zOf("[data-hero] > .hero-canvas"), scrim: zOf("[data-hero] > .hero-scrim") };
  });
  expect(z.scrim).toBeGreaterThan(z.canvas);
  expect(z.scrim).toBeGreaterThan(z.poster);
  expect(z.scrim).toBeLessThan(0);
  expect(await page.locator(".hero-copy").evaluate((el) => getComputedStyle(el).zIndex)).toBe("auto");

  // scripts/render-poster.mjs screenshots the canvas box in capture mode: the scrim must not be baked into the poster,
  // which the scrim then covers again on the page.
  await page.goto("/?capture=1");
  await expect(page.locator("html")).toHaveClass(/\bcapture\b/);
  await expect(scrim).toHaveCSS("opacity", "0");
});
