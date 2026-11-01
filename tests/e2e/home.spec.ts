import { expect, test, type Page } from "@playwright/test";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test.describe("home page", () => {
  test("renders hero, facts, practice and services without errors", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Clarity,\s*line by line\./);
    await expect(page.getByText("ICAI firm registration")).toBeVisible();
    await expect(page.locator("#practice")).toBeVisible();
    await expect(page.locator("#services h3")).toHaveCount(5);
    await expect(page.locator('#services a[href="#contact"]')).toHaveCount(5);
    expect(errors).toEqual([]);
  });

  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  // WCAG 2.5.3 label in name (axe / Lighthouse "label-content-name-mismatch"): an aria-label replaces the link's text
  // in its accessible name, so the monogram the link shows was missing from the name it announces.
  test("the header's home link takes its accessible name from the text it shows", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("[data-site-header] a[href='/']");
    await expect(link).not.toHaveAttribute("aria-label");
    // The firm name it shows leads the name; the monogram is aria-hidden decoration; ", home" is screen-reader text.
    const shownName = (await link.locator(".font-serif").last().innerText()).trim();
    const escaped = shownName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(link).toHaveAccessibleName(new RegExp(`^${escaped}.*, home$`));
  });
});

test.describe("tablet width", () => {
  test.use({ viewport: { width: 768, height: 1024 } });
  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

// Regression: the registration number ("000000S") is the widest fact value and used to spill out of its cell
// (and off the screen at 360 px). Check the facts grid at the narrowest widths and around each layout switch.
for (const width of [320, 360, 1024, 1280]) {
  test.describe(`facts at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("no horizontal overflow and every fact value fits its cell", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      const cells = await page.locator("section[aria-label='Firm facts'] dl dd").evaluateAll((dds) =>
        dds.map((dd) => {
          const cell = dd.parentElement as HTMLElement;
          const range = document.createRange();
          range.selectNodeContents(dd);
          const textRight = range.getBoundingClientRect().right;
          const contentRight = cell.getBoundingClientRect().right - parseFloat(getComputedStyle(cell).paddingRight);
          return {
            text: dd.textContent,
            scrollWidth: dd.scrollWidth,
            clientWidth: dd.clientWidth,
            textRight: Math.round(textRight * 10) / 10,
            contentRight: Math.round(contentRight * 10) / 10,
          };
        }),
      );
      expect(cells).toHaveLength(4);
      for (const c of cells) {
        expect(c.scrollWidth, `${c.text} scrollWidth`).toBeLessThanOrEqual(c.clientWidth);
        expect(c.textRight, `${c.text} right edge vs cell content edge`).toBeLessThanOrEqual(c.contentRight);
      }
    });
  });
}

test.describe("home page — lower sections", () => {
  test("renders process, partners, contact and footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#process li[data-step]")).toHaveCount(4);
    await expect(page.locator("#partners li")).toHaveCount(4);
    await expect(page.locator('#contact a[href^="tel:"]')).toHaveCount(1);
    await expect(page.locator("footer")).toContainText("not an advertisement");
  });

  test("copy email shows a confirmation", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "clipboard check runs once");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByRole("button", { name: "Copy email" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("office@firmname.in");
  });
});
