import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window { __longTasks?: number[] }
}

async function settle(page: Page) {
  await page.goto("/");
  await page.waitForTimeout(2500);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
}

/**
 * The e2e browser renders WebGL in software (SwiftShader, on the CPU). With WebGL unavailable the hero takes its poster
 * tier and mounts no canvas, which separates the software renderer's cost from the page's own main-thread work.
 */
async function withoutWebGL(page: Page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type.startsWith("webgl") ? null : Reflect.apply(getContext, this, [type, ...rest]);
    } as typeof getContext;
  });
}

test.describe("visual review captures", () => {
  test.skip(!process.env.VISUAL, "set VISUAL=1");
  test("capture", async ({ page }, info) => {
    await settle(page);
    await page.screenshot({ path: `test-results/shots/${info.project.name}-hero.png` });
    await page.screenshot({ path: `test-results/shots/${info.project.name}-full.png`, fullPage: true });
  });
  test.describe("tablet", () => {
    test.use({ viewport: { width: 768, height: 1024 } });
    test("capture", async ({ page }, info) => {
      await settle(page);
      await page.screenshot({ path: `test-results/shots/tablet-${info.project.name}-full.png`, fullPage: true });
    });
  });
  // The smallest full-tier hero: the copy sits closest to the fan's crown here.
  test.describe("small laptop", () => {
    test.use({ viewport: { width: 1024, height: 768 } });
    test("capture", async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "a fine-pointer viewport");
      await settle(page);
      await page.screenshot({ path: `test-results/shots/laptop-1024-hero.png` });
    });
  });
});

test("no long tasks while scrolling at 4× CPU throttle", async ({ page }, info) => {
  test.skip(!process.env.PERF || info.project.name !== "desktop", "set PERF=1 (desktop project)");
  if (process.env.PERF_NO_WEBGL) await withoutWebGL(page);
  await page.goto("/");
  await page.waitForTimeout(3000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.evaluate(() => {
    window.__longTasks = [];
    new PerformanceObserver((list) => {
      window.__longTasks?.push(...list.getEntries().map((e) => Math.round(e.duration)));
    }).observe({ type: "longtask" });
  });
  await page.mouse.move(720, 450);
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 250);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1500);
  const longTasks = await page.evaluate(() => window.__longTasks ?? []);
  const tier = await page.locator("[data-hero]").getAttribute("data-tier");
  console.log(`hero tier: ${tier}; long tasks (ms):`, longTasks);
  expect(longTasks.filter((d) => d > 50)).toEqual([]);
});
