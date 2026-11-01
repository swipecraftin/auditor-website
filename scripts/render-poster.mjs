// Renders the hero poster (landscape + portrait) and app/opengraph-image.png (poster + wordmark, spec §10) from the
// live scene. Run with: npm run poster   (builds first, then starts its own production server on :3100)
import { execSync, spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
// Each poster is rendered at the widest hero box it stands in for (the hero is 100vw × clamp(640px, 100svh, 1000px)).
// The live camera's fov is vertical, so at every narrower hero the live frame is this render with its sides trimmed,
// which is what HeroPoster's object-cover does. Output is sized by height, the dimension that always fills the hero.
const SHOTS = [
  // 3.5 : 1 covers QHD (2560 × 1000 hero, 2.56) and 21:9 ultrawides (3440 × 1000, 3.44); the landscape camera.
  { name: "ledger-poster", viewport: { width: 2240, height: 640 }, height: 1200 },
  // Just under square: the widest hero that still gets the portrait camera (width < height).
  { name: "ledger-poster-portrait", viewport: { width: 999, height: 1000 }, height: 1920 },
];
// The Open Graph card keeps its own 16:10 shot: its 1.91 : 1 crop is taken from the bottom of it (see renderOpenGraph).
const OG = { width: 1200, height: 630, viewport: { width: 1440, height: 900 } };

/** A failure explained to the person running the script (printed without a stack trace). */
class RenderError extends Error {}

/** HTTP status at `url`, or 0 when nothing is listening. */
async function probe(url) {
  try {
    return (await fetch(url)).status;
  } catch {
    return 0;
  }
}

async function waitForServer(server, url, ms = 90_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (server.exitCode !== null) throw new RenderError(`"next start" exited with code ${server.exitCode} (is there a build?)`);
    if ((await probe(url)) === 200) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new RenderError(`the server at ${url} did not start within ${ms / 1000} s`);
}

/** Stops the server this script started, by PID (with its child processes on Windows). */
function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: "ignore" });
    else server.kill("SIGTERM");
  } catch {
    // already gone
  }
}

const kb = async (file) => `${Math.round((await stat(file)).size / 1024)} KB`;

/** Opens the capture page and returns it once the live scene has drawn; throws if the hero fell back to the poster. */
async function openScene(browser, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/?capture=1`);
  // Whichever comes first: the first frame is drawn, or the hero degraded to the poster tier (no WebGL2, the renderer
  // failed). In capture mode a degraded hero is blank: the poster and the copy are hidden.
  const settled = await page
    .waitForFunction(
      () => {
        const hero = document.querySelector("[data-hero]");
        return hero?.getAttribute("data-hero-ready") === "true" || hero?.getAttribute("data-tier") === "poster";
      },
      null,
      { timeout: 60_000 },
    )
    .then(
      () => true,
      () => false,
    );
  if (settled) await page.waitForTimeout(1000); // the canvas fade-in and ContactShadows settle
  const state = await page.evaluate(() => {
    const hero = document.querySelector("[data-hero]");
    const box = hero?.getBoundingClientRect();
    return {
      tier: hero?.getAttribute("data-tier") ?? null,
      ready: hero?.getAttribute("data-hero-ready") ?? null,
      canvases: document.querySelectorAll("[data-hero] > .hero-canvas canvas").length,
      box: box ? { width: Math.round(box.width), height: Math.round(box.height) } : null,
    };
  });
  if (state.tier !== "full" || state.ready !== "true" || state.canvases !== 1) {
    await page.close();
    throw new RenderError(
      `the live 3D scene did not render at ${viewport.width}×${viewport.height}` +
        ` (${settled ? "" : "timed out after 60 s; "}data-tier=${state.tier}, data-hero-ready=${state.ready},` +
        ` ${state.canvases} canvas). Capture needs WebGL2: launch Edge with --use-angle=swiftshader --enable-unsafe-swiftshader.`,
    );
  }
  if (state.box?.width !== viewport.width || state.box?.height !== viewport.height) {
    await page.close();
    throw new RenderError(
      `the hero is ${state.box?.width}×${state.box?.height} in a ${viewport.width}×${viewport.height} viewport, so the render` +
        " would not have the intended aspect ratio; keep SHOTS in step with the .hero height in app/globals.css",
    );
  }
  return page;
}

/**
 * Spec §10: the Open Graph image is the hero poster plus the wordmark. The wordmark is set in the page's own serif and
 * colour, and the name comes from the page's og:site_name (content/site.ts), so a renamed firm only needs a re-run.
 */
async function renderOpenGraph(page) {
  const viewport = page.viewportSize();
  // Bottom-aligned crop: the landscape camera seats the fan on the bottom edge, the dark stage above takes the trim.
  const height = (viewport.width * OG.height) / OG.width;
  const top = viewport.height - height;
  // The wordmark sits in the middle of the dark band above the fan (the fan's crown is at ~48 % of the crop).
  const markCentre = top + height * 0.24;
  await page.evaluate(async (centreY) => {
    const name = document.querySelector('meta[property="og:site_name"]')?.getAttribute("content");
    const title = document.querySelector("#hero-title");
    if (!name || !title) throw new Error("og:site_name or #hero-title is missing");
    const { fontFamily, color } = getComputedStyle(title);
    const mark = document.createElement("p");
    mark.textContent = name;
    Object.assign(mark.style, {
      position: "fixed",
      insetInline: "0",
      top: `${centreY}px`,
      transform: "translateY(-50%)",
      margin: "0",
      zIndex: "10",
      textAlign: "center",
      fontFamily,
      color,
      fontWeight: "500",
      fontSize: "104px",
      lineHeight: "0.9",
      letterSpacing: "-0.03em",
    });
    document.body.append(mark);
    await document.fonts.ready;
  }, markCentre);
  const png = await page.screenshot({ clip: { x: 0, y: top, width: viewport.width, height } });
  await sharp(png).resize(OG.width, OG.height).png({ compressionLevel: 9 }).toFile("app/opengraph-image.png");
  console.log(`rendered opengraph-image (${await kb("app/opengraph-image.png")})`);
}

let server;
let browser;
try {
  if (await probe(BASE)) {
    throw new RenderError(`something is already listening on ${BASE} (a stale server would serve an old build); stop it first`);
  }
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], { stdio: "ignore" });
  await waitForServer(server, BASE);
  browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  await mkdir("public/hero", { recursive: true });
  for (const shot of SHOTS) {
    const page = await openScene(browser, shot.viewport);
    const png = await page.locator("[data-hero] > .hero-canvas").screenshot();
    const image = sharp(png).resize({ height: shot.height });
    const avif = `public/hero/${shot.name}.avif`;
    const webp = `public/hero/${shot.name}.webp`;
    await image.clone().avif({ quality: 50 }).toFile(avif);
    await image.clone().webp({ quality: 72 }).toFile(webp);
    const { width, height } = await sharp(avif).metadata();
    console.log(`rendered ${shot.name} ${width}×${height} (avif ${await kb(avif)}, webp ${await kb(webp)})`);
    await page.close();
  }
  const ogPage = await openScene(browser, OG.viewport);
  await renderOpenGraph(ogPage);
  await ogPage.close();
} catch (error) {
  console.error(error instanceof RenderError ? `render-poster: ${error.message}` : error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  stopServer(server);
}
