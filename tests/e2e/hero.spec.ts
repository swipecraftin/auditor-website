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

test("reduced motion uses the poster tier and never mounts a canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-tier", "poster");
  // Live tiers mount ~1.5 s after fonts are ready (after the headline intro), then at idle: wait longer than that.
  await page.waitForTimeout(4000);
  await expect(page.locator(".hero-canvas")).toHaveCount(0);
});
