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

test("reduced motion shows the server-rendered poster image", async ({ page, request }, testInfo) => {
  // For these visitors the poster is the hero's largest paint: it is fetched at high priority from the server HTML on.
  const html = await (await request.get("/")).text();
  expect(html).toMatch(/<picture[^>]*hero-poster[^]*?<img[^>]*fetchpriority="high"/i);
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

/**
 * Hero boxes the poster has to stand in for (the hero is 100vw × clamp(640px, 100svh, 1000px)). The live camera keeps
 * its vertical framing at every aspect ratio (perspective fov is vertical) and picks the portrait camera when the hero
 * box is taller than wide, so a faithful poster is the file of the same orientation, showing its full height.
 */
const HERO_BOXES = [
  { name: "full-HD desktop", width: 1920, height: 1080 },
  { name: "125 % laptop", width: 1536, height: 864 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "QHD desktop (hero capped at 1000)", width: 2560, height: 1440 },
  { name: "21:9 ultrawide (hero 3440 × 1000)", width: 3440, height: 1440 },
  { name: "iPad Pro portrait (hero 1024 × 1000: landscape camera)", width: 1024, height: 1366 },
  { name: "portrait monitor (hero 1080 × 1000: landscape camera)", width: 1080, height: 1920 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "near-square portrait window", width: 900, height: 1000 },
  { name: "small landscape phone (hero 568 × 640: portrait camera)", width: 568, height: 320 },
  { name: "phone", width: 390, height: 844 },
];
/** Wider than the landscape poster: the poster may lose dark stage at the top, but never the book at the bottom. */
const ULTRAWIDE = { name: "32:9 super-ultrawide (hero 5120 × 1000)", width: 5120, height: 1440 };

/** Which rows of the poster file the visitor sees (`object-fit: cover`, computed `object-position`). */
async function posterFrame(page: Page, selector: string) {
  const img = page.locator(selector).first();
  await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 1)).toBe(true);
  return img.evaluate((el) => {
    const image = el as HTMLImageElement;
    const hero = image.closest("[data-hero]")!.getBoundingClientRect();
    const box = image.getBoundingClientRect();
    const { objectFit, objectPosition } = getComputedStyle(image);
    const [, y] = objectPosition.split(" ");
    const scale = Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight);
    const offset = (box.height - image.naturalHeight * scale) * (parseFloat(y) / 100);
    return {
      src: image.currentSrc,
      objectFit,
      objectPosition,
      heroPortrait: hero.width < hero.height,
      naturalHeight: image.naturalHeight,
      top: -offset / scale,
      bottom: (box.height - offset) / scale,
    };
  });
}

/** Soft: one run reports every hero size that breaks. */
function expectFaithfulPoster(frame: Awaited<ReturnType<typeof posterFrame>>, name: string, fullHeight: boolean) {
  expect.soft(frame.src, `${name}: same camera orientation as the live hero`).toMatch(
    frame.heroPortrait ? /\/hero\/ledger-poster-portrait\.(avif|webp)$/ : /\/hero\/ledger-poster\.(avif|webp)$/,
  );
  expect.soft(frame.objectFit, name).toBe("cover");
  expect.soft(frame.objectPosition, `${name}: anchored to the floor the book stands on`).toMatch(/ 100%$/);
  expect.soft(frame.bottom, `${name}: the bottom of the poster (the book) is never cropped`).toBeCloseTo(frame.naturalHeight, 0);
  if (fullHeight) expect.soft(frame.top, `${name}: the full height shows, as in the live scene`).toBeCloseTo(0, 0);
}

test.describe("the poster keeps the live scene's framing at any hero size", () => {
  test.describe.configure({ timeout: 180_000 });

  test("server-rendered copy (reduced motion)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "sets its own viewports");
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const box of [...HERO_BOXES, ULTRAWIDE]) {
      await page.setViewportSize({ width: box.width, height: box.height });
      await page.goto("/");
      expectFaithfulPoster(await posterFrame(page, ".hero-poster img"), box.name, box !== ULTRAWIDE);
    }
  });

  test("forced copy (low-end device)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "sets its own viewports");
    await lowEndDevice(page);
    for (const box of [...HERO_BOXES, ULTRAWIDE]) {
      await page.setViewportSize({ width: box.width, height: box.height });
      await page.goto("/");
      expectFaithfulPoster(await posterFrame(page, ".hero-poster-forced img"), box.name, box !== ULTRAWIDE);
    }
  });
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
