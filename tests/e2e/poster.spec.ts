import { expect, test, type Page } from "@playwright/test";

/** Art direction: portrait viewports (the mobile project, 390 × 844) get the portrait crop. */
const posterSrc = (project: string) =>
  project === "mobile" ? /\/hero\/ledger-poster-portrait\.(avif|webp)$/ : /\/hero\/ledger-poster\.(avif|webp)$/;

const currentSrc = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((img) => (img as HTMLImageElement).currentSrc);

/** A 1 GB device: `decideHeroTier` puts it in the poster tier (deviceMemory ≤ 2). */
async function lowEndDevice(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "deviceMemory", { configurable: true, get: () => 1 });
  });
}

test("poster and Open Graph assets are served", async ({ page, request }) => {
  for (const file of ["ledger-poster.avif", "ledger-poster.webp", "ledger-poster-portrait.avif", "ledger-poster-portrait.webp"]) {
    expect((await request.get(`/hero/${file}`)).status(), file).toBe(200);
  }
  expect((await request.get("/opengraph-image.png")).status()).toBe(200);

  // The app/opengraph-image.png + .alt.txt file convention emits the Open Graph tags.
  await page.goto("/");
  const og = (property: string) => page.locator(`head meta[property="${property}"]`);
  await expect(og("og:image")).toHaveAttribute("content", /\/opengraph-image\.png(\?|$)/);
  await expect(og("og:image:width")).toHaveAttribute("content", "1200");
  await expect(og("og:image:height")).toHaveAttribute("content", "630");
  const alt = await og("og:image:alt").getAttribute("content");
  expect(alt).toMatch(/open ledger/);
  expect(alt, "Next copies the .alt.txt file verbatim: no trailing newline").toBe(alt?.trim());
  const imageUrl = new URL((await og("og:image").getAttribute("content")) ?? "");
  expect((await request.get(imageUrl.pathname + imageUrl.search)).status()).toBe(200);
});

test("reduced motion shows the server-rendered poster image", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await currentSrc(page, ".hero-poster img")).toMatch(posterSrc(testInfo.project.name));
  await page.waitForSelector("html.motion-ready"); // hydrated: HeroStage has decided
  await expect(page.locator(".hero-poster")).toHaveCount(1); // no second, client-forced copy
});

test("live-3D visitors never download the poster", async ({ page }) => {
  const posterRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/hero/ledger-poster")) posterRequests.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-hero-ready", "true", { timeout: 30_000 });
  expect(posterRequests).toEqual([]);
});

test("a low-end device gets the poster at once, without waiting for the headline intro", async ({ page }, testInfo) => {
  await lowEndDevice(page);
  // Live tiers mount only after the headline intro, which starts when fonts are ready. Never resolving fonts.ready
  // proves the poster does not wait for any of that.
  await page.addInitScript(() => {
    Object.defineProperty(FontFaceSet.prototype, "ready", { configurable: true, get: () => new Promise(() => {}) });
  });
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-tier", "poster");
  await expect(page.locator(".hero-poster-forced img")).toBeVisible();
  await expect.poll(() => currentSrc(page, ".hero-poster-forced img")).toMatch(posterSrc(testInfo.project.name));
  await expect(page.locator(".hero-canvas")).toHaveCount(0);
});

test("a renderer that fails at runtime degrades to the poster", async ({ page }, testInfo) => {
  // Same failure as hero.spec: the tier probe gets WebGL2, three's renderer does not.
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
  await expect(hero).toHaveAttribute("data-tier", "poster", { timeout: 15_000 });
  await expect(page.locator(".hero-poster-forced img")).toBeVisible();
  await expect.poll(() => currentSrc(page, ".hero-poster-forced img")).toMatch(posterSrc(testInfo.project.name));
  await expect(page.locator(".hero-canvas")).toHaveCount(0);
});
