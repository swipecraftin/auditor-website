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

  // At 390 px a service title broke as "Company Law & / ROC" and a summary left "audits." alone on its last line.
  test("headings balance their lines and running text avoids a lone last word", async ({ page }) => {
    await page.goto("/");
    const wrap = (selector: string) =>
      page.locator(selector).first().evaluate((el) => getComputedStyle(el).textWrapStyle);
    for (const heading of ["#services h3", "#process h3", "#partners h2", "#contact h2"]) expect(await wrap(heading)).toBe("balance");
    for (const text of ["#services .svc-summary", "#process [data-step-body]", "#partners p", "footer p"]) expect(await wrap(text)).toBe("pretty");
  });

  // mobile-native: taps answer in the palette (not the default grey-blue flash), controls skip the double-tap-to-zoom
  // wait, and a long press on a button does not select its label.
  test("taps feel native: palette tap highlight, no double-tap delay, button labels not selectable", async ({ page }) => {
    await page.goto("/");
    const style = (selector: string, prop: string) =>
      page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
    expect(await style("#contact a[href^='tel:']", "-webkit-tap-highlight-color")).toBe("rgba(241, 236, 228, 0.08)");
    for (const control of ["#contact a[href^='tel:']", "button[aria-controls='site-menu']", "#contact button"]) {
      expect(await style(control, "touch-action")).toBe("manipulation");
    }
    expect(await style("#contact button", "user-select")).toBe("none");
    expect(await style("#contact a[href^='tel:']", "user-select")).toBe("auto"); // a phone number stays copyable
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

// break-ui: real names and addresses are longer than the placeholders. An unbreakable email widened the page past the
// viewport on phones (taking the fixed header, and its menu button, with it), and an 18-letter partner name ran into the
// next card. Swap in worst-case values where the content renders, then check that everything stays inside its box.
// Names should also break between words, not inside one: at 1024 px four-up cards split even "Chandrasekhar". The one
// accepted exception is 640–670 px (two-up, narrowest), where only an 18-letter word does not fit and breaks.
const LONG_EMAIL = "partners.office@venkataraghavanchandrasekaran.co.in";
const LONG_NAMES = ["Venkatasubramanian Raghunathan", "Lakshminarayanan Chandrasekhar", "Srinivasaraghavan Padmanabhan", "Jo Rao"];
for (const width of [320, 640, 1024, 1280, 1440]) {
  test.describe(`worst-case content at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("long emails and partner names wrap inside their boxes", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const spills = await page.evaluate(({ longEmail, names, wholeWords }) => {
        document.querySelectorAll<HTMLAnchorElement>("a[href^='mailto:']").forEach((a) => (a.textContent = longEmail));
        document.querySelectorAll(".partner-name").forEach((el, i) => (el.textContent = names[i % names.length]));
        const spill = (el: Element, box: Element) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return Math.round(range.getBoundingClientRect().right - box.getBoundingClientRect().right);
        };
        const out: string[] = [];
        document.querySelectorAll(".partner-name").forEach((el) => {
          const card = el.closest("li")!;
          const right = spill(el, card) + parseFloat(getComputedStyle(card).paddingRight);
          if (right > 0) out.push(`${el.textContent} spills its card by ${right}px`);
          if (wholeWords) {
            const text = el.firstChild!;
            for (const match of el.textContent!.matchAll(/\S+/g)) {
              const word = document.createRange();
              word.setStart(text, match.index);
              word.setEnd(text, match.index + match[0].length);
              const lines = new Set([...word.getClientRects()].map((r) => Math.round(r.top)));
              if (lines.size > 1) out.push(`"${match[0]}" breaks across lines`);
            }
          }
        });
        const email = document.querySelector("#contact a[href^='mailto:']")!;
        const column = email.closest("[data-reveal]")!;
        if (spill(email, column) > 0) out.push(`contact email spills its column by ${spill(email, column)}px`);
        return out;
      }, { longEmail: LONG_EMAIL, names: LONG_NAMES, wholeWords: width !== 640 });
      expect(spills).toEqual([]);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      // The menu's email, once it is open.
      await page.getByRole("button", { name: "Open menu" }).click();
      const menuEmail = page.locator("#site-menu a[href^='mailto:']");
      await expect(menuEmail).toBeVisible();
      const menuSpill = await menuEmail.evaluate((a) => {
        const range = document.createRange();
        range.selectNodeContents(a);
        return range.getBoundingClientRect().right - document.documentElement.clientWidth;
      });
      expect(menuSpill).toBeLessThanOrEqual(0);
    });
  });
}

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
