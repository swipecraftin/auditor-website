import { expect, test } from "@playwright/test";

test("robots, sitemap and JSON-LD are served", async ({ page, request }) => {
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/disclaimer");
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(ld ?? "{}")["@type"]).toBe("AccountingService");
});
