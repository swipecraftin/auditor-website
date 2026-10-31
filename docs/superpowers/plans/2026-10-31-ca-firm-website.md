# CA Firm Website v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved dark-premium, CRED-inspired single-page website for an Indian CA firm (plus `/disclaimer`), with an "open ledger" 3D hero and a Lenis + GSAP motion system that scrolls without jank.

**Architecture:** Next.js App Router with Server Components rendering semantic HTML from one typed content file. Motion is attached by a few client "controller" components that find elements through `data-*` attributes, so all content works without JavaScript. The 3D hero is a lazily mounted React Three Fiber canvas with quality tiers and a static poster fallback.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · GSAP 3.15 (ScrollTrigger, SplitText, CustomEase) + @gsap/react · Lenis 1.3 · three 0.187 · @react-three/fiber 9 · @react-three/drei 10 · Vitest · Playwright 1.64 (msedge channel) · sharp

**Spec:** `docs/superpowers/specs/2026-10-31-ca-firm-website-design.md` (read it before starting any task). Visual reference: `docs/design/mockup/`.

## Global Constraints

- Project root: `C:\Users\satys\Desktop\auditor website` (Git Bash: `/c/Users/satys/Desktop/auditor website`). **The path contains a space — always quote it.**
- Branch `feat/site-v1`. Never commit to `main`. Never push.
- Every commit message ends with these two lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
  ```
- Node 22.19, npm 11. Use `npm` only.
- Versions: `next` 16.x (from `create-next-app@latest`), `react` 19, `tailwindcss` 4, `gsap@^3.15.0`, `@gsap/react@^2.1.2`, `lenis@^1.3.27`, `three@^0.187.0`, `@react-three/fiber@^9.8.2`, `@react-three/drei@^10.7.9`, `@playwright/test@^1.64.1`. Do not install TypeScript manually; keep the version create-next-app pins.
- All GSAP plugins come from the public `gsap` package (they are free). Never add an `.npmrc` or a GreenSock registry.
- Colours: bg `#0B0B0C`, surface `#121214`, ink `#F1ECE4`, muted `#9C978E`, line `rgb(241 236 228 / 0.16)`, brass `#C9A96E` (brass never for body text).
- Fonts: Fraunces (serif, variable, opsz axis, normal + italic), Manrope (sans), IBM Plex Mono 400/500 (labels: uppercase, tracking 0.12em) via `next/font/google`.
- **Spacing scale — the only allowed padding/margin/gap values:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px = Tailwind `1, 2, 3, 4, 6, 8, 12, 16, 24, 32` (plus `0`, `px`, `auto`, and `(--css-var)` references). No arbitrary spacing like `p-[13px]`. Enforced by `tests/unit/spacing-scale.test.ts` (Task 3).
- Motion tokens: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`, editorial ease `expo.out`, `--dur-press: 140ms`, `--dur-ui: 200ms`, `--dur-overlay: 500ms`, editorial 0.9 s, lines 1.1 s, stagger UI 0.04 s / editorial 0.08 s, reveal distance 24 px.
- Animate only `transform` and `opacity` (`clip-path` only for line masks and the menu overlay). Never animate width/height/top/left/margin/padding.
- `prefers-reduced-motion: reduce` → no Lenis, no scrubs, no pins, no intro, poster hero, all content visible immediately.
- ICAI rules (spec §11): no fees/prices/"free", no testimonials/reviews/client names or logos, no superlatives ("best", "leading", "No. 1", "top", "most trusted"), no pop-ups, contact is pull-only.
- All firm content lives in `content/site.ts`. Components never hard-code firm copy.
- Dev/E2E server port: **3100**.
- Before coding a task, `Read` the SKILL.md files listed in the task's **Skills** line (paths under `.claude/skills/`). The Skill tool listing may not show project skills inside a worktree.

## Resolved spec conflicts (binding for implementers)

1. **Tablet gutter = 48 px**, not 40 (spec §5.3 lists 40, which is off the spacing scale). Gutters: 24 (< 640), 48 (≥ 640), 64 (≥ 1024).
2. **Hero intro line reveal = 0.95 s, delay 0.1 s, stagger 0.08 s** so the headline is fully visible ≤ 1.2 s after fonts are ready (spec M1 budget beats M1's 1.1 s).
3. **Poster tier memory threshold = `navigator.deviceMemory ≤ 2`** (spec says ≤ 4; browsers report 6 GB phones as 4, which would deny most phones the live 3D the owner asked for).
4. **Header is `position: fixed` from the start**, transparent over the hero (visually identical to "absolute, then fixed").
5. **Menu overlay is a sibling of the header**, not a child (a transformed header would trap a fixed child), and has its own close button; the header is `inert` while the menu is open.
6. **Process steps** reveal through the Process controller on mobile (not `data-reveal`) so they never fight the desktop pin timeline.
7. **Service rows are links to `#contact`** (hover/focus states need a real interactive element).
8. **Live-3D visitors never see or download the poster.** The server-rendered `<picture>` only selects real images under `prefers-reduced-motion: reduce` (everyone else gets a transparent pixel); the low-end poster tier renders a forced poster client-side. The canvas fades in over the CSS backdrop. This saves bytes and avoids an open-book poster jumping to a closed book when the intro starts (spec §6 "poster always in the markup, canvas crossfades over it").

## File Structure

```
app/
  layout.tsx                 fonts, metadata, motion boot script, MotionProvider, SiteChrome, Footer, skip link
  page.tsx                   home: sections + JSON-LD + motion controllers
  disclaimer/page.tsx        full disclaimer
  globals.css                Tailwind v4 import, @theme tokens, utilities, motion initial states
  robots.ts  sitemap.ts  icon.svg  opengraph-image.png  opengraph-image.alt.txt
components/
  ui/Monogram.tsx            monogram box
  ui/CopyEmail.tsx           copy-to-clipboard button (client)
  ui/Magnetic.tsx            magnetic wrapper, fine pointers only (client)
  sections/Hero.tsx  Facts.tsx  Practice.tsx  Services.tsx  Process.tsx  Partners.tsx  Contact.tsx
  layout/SiteChrome.tsx      menu state; renders Header + MenuOverlay (client)
  layout/Header.tsx          header bar + hide/show (client)
  layout/MenuOverlay.tsx     dialog menu (client)
  layout/header-state.ts     pure hide/show logic
  layout/Footer.tsx          footer (server)
  seo/JsonLd.tsx             AccountingService JSON-LD
  motion/MotionProvider.tsx  Lenis + GSAP ticker + ScrollTrigger sync + anchor scrolling (client)
  motion/motion-env.ts       isMotionOk() helper
  motion/PageMotion.tsx      RevealController + SplitController (client)
  motion/HeroMotion.tsx      hero text intro + scroll-out (client)
  motion/ProcessMotion.tsx   process pin / mobile reveal (client)
  hero/tier.ts               decideHeroTier + readTierEnv (pure + browser reader)
  hero/ledger-math.ts        page angle math (pure)
  hero/LedgerScene.tsx       R3F scene (client)
  hero/HeroCanvas.tsx        Canvas, drivers, ready/offscreen logic (client, dynamic)
  hero/HeroStage.tsx         tier decision + lazy mount (client)
  hero/HeroPoster.tsx        <picture> poster (server)
content/site.ts  content/guard.ts  content/PLACEHOLDERS.md
lib/gsap.ts                  plugin registration + custom eases (client)
lib/motion.ts                motion tokens (mirrors CSS)
scripts/render-poster.mjs    renders poster + OG image with Playwright + sharp
tests/unit/*.test.ts         Vitest
tests/e2e/*.spec.ts          Playwright
vitest.config.ts  playwright.config.ts
```

---

### Task 1: Scaffold Next.js app and tooling

**Files:**
- Create (generated): `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/*`
- Create: `.gitattributes`, `vitest.config.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `test` (`vitest run --passWithNoTests`), `test:e2e` (`playwright test`), `typecheck` (`tsc --noEmit`); path alias `@/*` → project root.

**Skills:** none.

- [ ] **Step 1: Scaffold into a temp directory** (the repo directory is not empty, so `create-next-app .` would refuse it)

```bash
TMP="$(mktemp -d)" && cd "$TMP" && npx --yes create-next-app@latest ca-site --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git --skip-install --yes
ls "$TMP/ca-site"
```
Expected: `app  eslint.config.mjs  next.config.ts  package.json  postcss.config.mjs  public  tsconfig.json …` (no `node_modules`).

- [ ] **Step 2: Copy the scaffold into the repo without overwriting `.gitignore`**

```bash
R="/c/Users/satys/Desktop/auditor website"
mv "$TMP/ca-site/.gitignore" "$TMP/ca-site/.gitignore.next" 2>/dev/null
cp -r "$TMP/ca-site/." "$R/" && rm -f "$R/.gitignore.next" "$R/README.md"
cd "$R" && git status --short | head -20
```

- [ ] **Step 3: Replace `.gitignore` and add `.gitattributes`**

`.gitignore`:
```gitignore
# dependencies
node_modules/
.pnp
.pnp.*

# next.js
.next/
out/
next-env.d.ts
*.tsbuildinfo

# testing
coverage/
playwright-report/
test-results/
blob-report/

# env & local
.env*
!.env.example
.vercel/
*.log
npm-debug.log*
.DS_Store
Thumbs.db
*.pem

# impeccable local state
.impeccable/config.local.json
```

`.gitattributes`:
```gitattributes
* text=auto eol=lf
*.png binary
*.jpg binary
*.avif binary
*.webp binary
*.ico binary
```

- [ ] **Step 4: Install dependencies**

```bash
cd "/c/Users/satys/Desktop/auditor website"
npm install
npm install gsap@^3.15.0 @gsap/react@^2.1.2 lenis@^1.3.27 three@^0.187.0 @react-three/fiber@^9.8.2 @react-three/drei@^10.7.9
npm install -D @types/three vitest @playwright/test@^1.64.1 sharp
npm pkg set scripts.test="vitest run --passWithNoTests" scripts.test:e2e="playwright test" scripts.typecheck="tsc --noEmit"
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
```

- [ ] **Step 6: Replace the template page and remove template assets**

`app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main id="main">
      <h1>Firm Name &amp; Co.</h1>
    </main>
  );
}
```
```bash
cd "/c/Users/satys/Desktop/auditor website" && rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

- [ ] **Step 7: Verify the toolchain**

```bash
cd "/c/Users/satys/Desktop/auditor website" && npm run build && npm run lint && npm test && npm run typecheck
```
Expected: build succeeds (route `/` prerendered as static), lint and typecheck report no errors, Vitest prints "No test files found" and exits 0.

- [ ] **Step 8: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
chore: scaffold Next.js 16 app with GSAP, Lenis, R3F and test tooling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
git log --oneline -1
```

### Task 2: Content model and ICAI content guard

**Files:**
- Create: `content/site.ts`, `content/guard.ts`, `content/PLACEHOLDERS.md`
- Test: `tests/unit/guard.test.ts`

**Interfaces:**
- Produces: `site` (const object, shape below) and `type Site = typeof site` from `@/content/site`; `findIcaiViolations(value: unknown, path?: string): Violation[]` and `type Violation = { path: string; rule: string; text: string }` from `@/content/guard`.

**Skills:** none.

- [ ] **Step 1: Write the failing test** — `tests/unit/guard.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { findIcaiViolations } from "@/content/guard";
import { site } from "@/content/site";

describe("findIcaiViolations", () => {
  it("passes the real site content", () => {
    expect(findIcaiViolations(site)).toEqual([]);
  });

  it.each([
    ["The best CA firm in town", "superlative: best"],
    ["A leading practice", "superlative: leading"],
    ["Ranked No. 1", "superlative: No. 1"],
    ["Top auditors", "superlative: top"],
    ["Free consultation", "offer: free"],
    ["Returns from ₹999", "price"],
    ["Filing at Rs. 500", "price"],
  ])("flags %s", (text, rule) => {
    expect(findIcaiViolations({ copy: text })).toEqual([{ path: "site.copy", rule, text }]);
  });

  it("flags forbidden fields", () => {
    expect(findIcaiViolations({ testimonials: [] })).toEqual([
      { path: "site.testimonials", rule: "forbidden field: testimonials", text: "" },
    ]);
  });

  it("ignores words that only contain a banned word", () => {
    expect(findIcaiViolations({ a: "Desktop stop freedom" })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- tests/unit/guard.test.ts`
Expected: FAIL — cannot resolve `@/content/guard`.

- [ ] **Step 3: Create `content/site.ts`**

```ts
// Every value in this file is a placeholder — see content/PLACEHOLDERS.md.
export const site = {
  firm: {
    name: "Firm Name & Co.",
    monogram: "F&C",
    designation: "Chartered Accountants",
    frn: "000000S",
    established: 1998,
    city: "Hyderabad",
    url: "https://www.firmname.in",
  },
  hero: {
    eyebrow: "Audit · Tax · Advisory",
    headline: ["Clarity,", "line by line."],
    sub: "Audit, taxation and advisory for owner-led businesses, families and institutions, from our office in Hyderabad.",
  },
  facts: [
    { value: "1998", label: "Established" },
    { value: "4", label: "Partners" },
    { value: "2", label: "Offices" },
    { value: "000000S", label: "ICAI firm registration" },
  ],
  practice: {
    label: "The practice",
    statement: "We read every line, so the people who depend on your numbers",
    emphasis: "can read them plainly.",
  },
  services: [
    { n: "01", title: "Audit & Assurance", summary: "Statutory, internal and tax audits." },
    { n: "02", title: "Direct Tax", summary: "Returns, assessments, representation and planning." },
    { n: "03", title: "GST", summary: "Registration, returns, reconciliations and proceedings." },
    { n: "04", title: "Company Law & ROC", summary: "Incorporation, annual filings and secretarial compliance." },
    { n: "05", title: "Advisory", summary: "Structuring, valuations and transaction support." },
  ],
  process: [
    { n: "01", title: "Understand", body: "We learn the business, its records and its obligations before we test anything." },
    { n: "02", title: "Examine", body: "Fieldwork and testing, line by line, with questions raised as they arise." },
    { n: "03", title: "Report", body: "Findings, opinions and filings, written plainly and delivered on time." },
    { n: "04", title: "Advise", body: "What the numbers mean for the next decision, and how to act on it." },
  ],
  partners: [
    { name: "Partner Name", credential: "FCA", focus: "Audit & Assurance" },
    { name: "Partner Name", credential: "FCA", focus: "Direct Tax" },
    { name: "Partner Name", credential: "ACA", focus: "GST" },
    { name: "Partner Name", credential: "ACA", focus: "Advisory" },
  ],
  contact: {
    phone: "+91 00000 00000",
    email: "office@firmname.in",
    address: ["Address line 1", "Hyderabad 500 000", "Telangana, India"],
    hours: "Mon–Sat, 10:00–18:30",
    mapUrl: "https://maps.google.com/?q=Hyderabad",
  },
  disclaimer: {
    short:
      "This website provides information about the firm and its services. It is not an advertisement or a solicitation of work.",
    // DRAFT — the firm must verify this wording against ICAI's current Code of Ethics.
    full: [
      "The information on this website is provided for general information about Firm Name & Co. and the services it offers. It does not constitute professional advice, an advertisement, or a solicitation of work.",
      "No reader should act on the basis of any material on this website without seeking specific professional advice. The firm accepts no liability for any loss arising from reliance on this information.",
      "Links to external websites are provided for convenience; the firm is not responsible for their content.",
    ],
  },
} as const;

export type Site = typeof site;
```

- [ ] **Step 4: Create `content/guard.ts`**

```ts
export type Violation = { path: string; rule: string; text: string };

const BANNED: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bbest\b/i, "superlative: best"],
  [/\bleading\b/i, "superlative: leading"],
  [/\bno\.?\s?1\b/i, "superlative: No. 1"],
  [/\bnumber one\b/i, "superlative: number one"],
  [/\btop\b/i, "superlative: top"],
  [/\bmost trusted\b/i, "superlative: most trusted"],
  [/\bcheapest\b/i, "superlative: cheapest"],
  [/\bfree\b/i, "offer: free"],
  [/\bguarantee(d|s)?\b/i, "claim: guarantee"],
  [/(₹|\brs\.?)\s?\d/i, "price"],
];

const FORBIDDEN_KEYS = ["testimonials", "reviews", "ratings", "clients", "fees", "pricing", "prices"];

/** ICAI guard: returns every banned phrase, price or forbidden field found in `value`. */
export function findIcaiViolations(value: unknown, path = "site"): Violation[] {
  if (typeof value === "string") {
    return BANNED.filter(([re]) => re.test(value)).map(([, rule]) => ({ path, rule, text: value }));
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findIcaiViolations(item, `${path}[${i}]`));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => [
      ...(FORBIDDEN_KEYS.includes(key.toLowerCase())
        ? [{ path: `${path}.${key}`, rule: `forbidden field: ${key}`, text: "" }]
        : []),
      ...findIcaiViolations(item, `${path}.${key}`),
    ]);
  }
  return [];
}
```

- [ ] **Step 5: Create `content/PLACEHOLDERS.md`**

```markdown
# Placeholders to replace before launch

All live in `content/site.ts` unless noted.

| Field | Placeholder |
|---|---|
| firm.name / monogram | Firm Name & Co. / F&C |
| firm.frn | 000000S |
| firm.established | 1998 |
| firm.city | Hyderabad |
| firm.url (also `metadataBase` in `app/layout.tsx`) | https://www.firmname.in |
| facts | 1998 · 4 partners · 2 offices · FRN |
| partners | 4 × "Partner Name" with credential and focus |
| contact.phone / email | +91 00000 00000 / office@firmname.in |
| contact.address / hours / mapUrl | Address line 1, Hyderabad 500 000 … |
| disclaimer.full | DRAFT — verify against ICAI's current Code of Ethics |
```

- [ ] **Step 6: Run the test and confirm it passes**

Run: `npm test -- tests/unit/guard.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add content tests/unit/guard.test.ts && git commit -q -F - <<'EOF'
feat: add typed site content and ICAI content guard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 3: Design tokens, fonts, root layout and spacing guard

**Files:**
- Create: `lib/motion.ts`, `tests/unit/motion-tokens.test.ts`, `tests/unit/spacing-scale.test.ts`
- Modify (replace whole file): `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `site` from `@/content/site`.
- Produces: Tailwind utilities `bg-bg bg-surface text-ink text-muted text-brass border-line bg-line font-serif font-sans font-mono text-h1 text-statement text-h2 text-h3 text-fact text-body text-small text-label text-wordmark ease-out ease-in-out`; custom utilities `shell`, `section-y`, `label-mono`; CSS vars `--gutter`, `--dur-press`, `--dur-ui`, `--dur-overlay`, `--ease-out`, `--ease-in-out`; class `skip-link`. From `@/lib/motion`: `ease`, `easePoints`, `dur`, `stagger`, `reveal` (values below).

**Skills:** `animate` (easing/duration tables).

- [ ] **Step 1: Write the failing tests**

`tests/unit/motion-tokens.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dur, ease, easePoints, stagger } from "@/lib/motion";

const css = readFileSync("app/globals.css", "utf8");
const cssVar = (name: string) => css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
const ms = (s: number) => `${Math.round(s * 1000)}ms`;

describe("motion tokens", () => {
  it("CSS easing tokens mirror lib/motion.ts", () => {
    expect(cssVar("--ease-out")).toBe(ease.out);
    expect(cssVar("--ease-in-out")).toBe(ease.inOut);
  });
  it("CustomEase points match the cubic-bezier tokens", () => {
    expect(ease.out).toBe(`cubic-bezier(${easePoints.out.split(",").join(", ")})`);
    expect(ease.inOut).toBe(`cubic-bezier(${easePoints.inOut.split(",").join(", ")})`);
  });
  it("CSS duration tokens mirror lib/motion.ts", () => {
    expect(cssVar("--dur-press")).toBe(ms(dur.press));
    expect(cssVar("--dur-ui")).toBe(ms(dur.ui));
    expect(cssVar("--dur-overlay")).toBe(ms(dur.overlay));
  });
  it("UI micro-interactions stay under 300ms", () => {
    expect(dur.press).toBeLessThan(0.3);
    expect(dur.ui).toBeLessThan(0.3);
  });
  it("hero headline finishes within the 1.2s budget", () => {
    expect(0.1 + stagger.editorial + dur.heroLines).toBeLessThanOrEqual(1.2);
  });
});
```

`tests/unit/spacing-scale.test.ts`:
```ts
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ALLOWED = new Set(["0", "px", "1", "2", "3", "4", "6", "8", "12", "16", "24", "32", "auto"]);
const ALLOWED_PX = new Set([0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]);
const CLASS_RE =
  /(?<![\w-])((?:[\w-]+:)*)-?(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|scroll-mt|scroll-pt)-([^\s"'`}]+)/g;
const isAllowed = (v: string) => ALLOWED.has(v) || /^\(--[\w-]+\)$/.test(v);

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

describe("spacing scale", () => {
  it("detects off-scale classes", () => {
    const sample = `className="p-[13px] lg:mt-5 px-6 py-(--gutter) gap-px"`;
    const hits = [...sample.matchAll(CLASS_RE)].map((m) => m[3]).filter((v) => !isAllowed(v));
    expect(hits).toEqual(["[13px]", "5"]);
  });

  it("components use only scale values for padding, margin and gap", () => {
    const bad = [...files("app"), ...files("components")].flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(CLASS_RE)].filter((m) => !isAllowed(m[3])).map((m) => `${f}: ${m[0]}`),
    );
    expect(bad).toEqual([]);
  });

  it("globals.css uses only scale values for padding, margin and gap", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const bad = [...css.matchAll(/(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z-]+)?\s*:\s*([^;]+);/g)].filter(
      (m) => [...m[1].matchAll(/(-?\d+(?:\.\d+)?)px/g)].some((n) => !ALLOWED_PX.has(Math.abs(Number(n[1])))),
    );
    expect(bad.map((m) => m[0])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test`
Expected: FAIL — `@/lib/motion` not found; CSS vars missing.

- [ ] **Step 3: Create `lib/motion.ts`**

```ts
export const ease = {
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
  editorial: "expo.out",
} as const;

/** Control points for GSAP CustomEase ids "ui-out" and "ui-in-out" (registered in lib/gsap.ts). */
export const easePoints = { out: "0.23,1,0.32,1", inOut: "0.77,0,0.175,1" } as const;

/** Seconds. */
export const dur = {
  press: 0.14,
  ui: 0.2,
  overlay: 0.5,
  overlayClose: 0.35,
  editorial: 0.9,
  lines: 1.1,
  heroLines: 0.95,
  heroFade: 0.8,
  bookOpen: 1.6,
  light: 1.2,
} as const;

/** Seconds between items. */
export const stagger = { ui: 0.04, editorial: 0.08, chars: 0.02, pages: 0.012, heroFade: 0.06 } as const;

/** Pixels. */
export const reveal = { y: 24, heroY: 12 } as const;
```

- [ ] **Step 4: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0b0b0c;
  --color-surface: #121214;
  --color-ink: #f1ece4;
  --color-muted: #9c978e;
  --color-line: rgb(241 236 228 / 0.16);
  --color-brass: #c9a96e;

  --text-h1: clamp(54px, 35.43px + 4.76vw, 104px);
  --text-h1--line-height: 0.94;
  --text-h1--letter-spacing: -0.025em;
  --text-statement: clamp(32px, 24.57px + 1.905vw, 52px);
  --text-statement--line-height: 1.12;
  --text-statement--letter-spacing: -0.02em;
  --text-h2: clamp(40px, 31.09px + 2.286vw, 64px);
  --text-h2--line-height: 1;
  --text-h2--letter-spacing: -0.02em;
  --text-h3: clamp(26px, 22.29px + 0.952vw, 36px);
  --text-h3--line-height: 1.1;
  --text-h3--letter-spacing: -0.015em;
  --text-fact: clamp(36px, 33.03px + 0.762vw, 44px);
  --text-fact--line-height: 1;
  --text-body: clamp(16px, 15.63px + 0.095vw, 17px);
  --text-body--line-height: 1.6;
  --text-small: 15px;
  --text-small--line-height: 1.5;
  --text-label: clamp(11px, 10.63px + 0.095vw, 12px);
  --text-label--line-height: 1.4;
  --text-wordmark: clamp(34px, 9vw, 184px);
  --text-wordmark--line-height: 0.9;
  --text-wordmark--letter-spacing: -0.03em;

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

@theme inline {
  --font-serif: var(--font-fraunces), Georgia, serif;
  --font-sans: var(--font-manrope), system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, monospace;
}

:root {
  --gutter: 24px;
  --dur-press: 140ms;
  --dur-ui: 200ms;
  --dur-overlay: 500ms;
  color-scheme: dark;
}
@media (width >= 640px) { :root { --gutter: 48px; } }
@media (width >= 1024px) { :root { --gutter: 64px; } }

@layer base {
  html { background: var(--color-bg); }
  body { font-family: var(--font-sans); font-size: var(--text-body); line-height: 1.6; }
  :focus-visible { outline: 2px solid var(--color-brass); outline-offset: 4px; }
  ::selection { background: var(--color-brass); color: var(--color-bg); }
  section[id] { scroll-margin-top: 96px; }
}

@utility shell {
  width: 100%;
  max-width: calc(1312px + 2 * var(--gutter));
  margin-inline: auto;
  padding-inline: var(--gutter);
}
@utility section-y {
  padding-block: 64px;
  @media (width >= 640px) { padding-block: 96px; }
  @media (width >= 1024px) { padding-block: 128px; }
}
@utility label-mono {
  font-family: var(--font-mono);
  font-size: var(--text-label);
  line-height: 1.4;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@layer components {
  .skip-link {
    position: fixed; left: 16px; top: 16px; z-index: 100;
    padding: 12px 16px; background: var(--color-ink); color: var(--color-bg);
    transform: translateY(-200%);
  }
  .skip-link:focus-visible { transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Replace `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Manrope } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"], style: ["normal", "italic"], display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.firm.url),
  title: {
    default: `${site.firm.name} · ${site.firm.designation}, ${site.firm.city}`,
    template: `%s · ${site.firm.name}`,
  },
  description: site.hero.sub,
  openGraph: { type: "website", siteName: site.firm.name, locale: "en_IN" },
};

export const viewport: Viewport = { themeColor: "#0B0B0C", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="bg-bg font-sans text-ink antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Replace `app/page.tsx`** (token smoke test; Task 4 replaces it)

```tsx
import { site } from "@/content/site";

export default function Home() {
  return (
    <main id="main" className="shell section-y">
      <p className="label-mono text-muted">{site.hero.eyebrow}</p>
      <h1 className="mt-6 font-serif text-h1 text-ink">{site.hero.headline.join(" ")}</h1>
    </main>
  );
}
```

- [ ] **Step 7: Run tests, build and lint**

Run: `npm test && npm run build && npm run lint`
Expected: all unit tests PASS (guard + motion tokens + spacing scale); build and lint clean.

- [ ] **Step 8: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add design tokens, fonts, root layout and spacing-scale guard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

### Task 4: Playwright setup + Hero, Facts, Practice and Services (static markup)

**Files:**
- Create: `playwright.config.ts`, `components/sections/Hero.tsx`, `components/sections/Facts.tsx`, `components/sections/Practice.tsx`, `components/sections/Services.tsx`
- Modify: `app/page.tsx` (replace), `app/globals.css` (append)
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `site`; utilities from Task 3.
- Produces (data attributes later tasks rely on — keep them exactly):
  - `section#top[data-hero]` with children `.hero-backdrop`, `.hero-copy`, `[data-hero-fade]` (eyebrow, sub, corner link), `h1#hero-title[data-split="intro"]`, `a.hero-corner`.
  - `[data-split="lines"]` on fact values, `p[data-split="words-scrub"]` in Practice.
  - `[data-reveal]` on section labels/rows, `[data-line]` hairline spans, `a.svc-row` with `.svc-title`, `.svc-summary`, `.svc-arrow`.
  - Section ids: `practice`, `services`.

**Skills:** none (static markup).

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    channel: "msedge", // installed Microsoft Edge — no browser download
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
```

- [ ] **Step 2: Write the failing E2E test** — `tests/e2e/home.spec.ts`

```ts
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
});

test.describe("tablet width", () => {
  test.use({ viewport: { width: 768, height: 1024 } });
  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: FAIL — heading text and `#services` not found.

- [ ] **Step 4: Create `components/sections/Hero.tsx`**

```tsx
import { site } from "@/content/site";

export function Hero() {
  const { hero, contact } = site;
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="hero relative isolate overflow-hidden">
      <div aria-hidden className="hero-backdrop absolute inset-0 -z-30" />

      <div className="hero-copy absolute inset-x-0 top-32 px-(--gutter) text-center lg:top-40">
        <p data-hero-fade className="label-mono text-muted">{hero.eyebrow}</p>
        <h1 id="hero-title" data-split="intro" className="mt-6 font-serif text-h1 font-semibold text-ink">
          {hero.headline[0]}
          <br />
          {hero.headline[1]}
        </h1>
        <p data-hero-fade className="mx-auto mt-8 max-w-[44ch] text-body text-muted">{hero.sub}</p>
      </div>

      <a
        href="#contact"
        data-hero-fade
        className="hero-corner absolute inset-x-(--gutter) bottom-6 flex items-center justify-between gap-6 border border-line px-6 py-4 sm:right-(--gutter) sm:bottom-12 sm:left-auto"
      >
        <span className="flex flex-col gap-1">
          <span className="text-small font-semibold text-ink">Contact the partners</span>
          <span className="label-mono text-muted">{contact.phone}</span>
        </span>
        <span aria-hidden className="grid size-10 place-items-center border border-ink">→</span>
      </a>

      <div aria-hidden className="absolute bottom-12 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 label-mono text-muted lg:flex">
        <span className="h-8 w-px bg-linear-to-b from-ink to-transparent" />
        Scroll
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `components/sections/Facts.tsx`**

```tsx
import { site } from "@/content/site";

export function Facts() {
  return (
    <section aria-label="Firm facts" className="border-y border-line">
      <div className="shell">
        <dl className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
          {site.facts.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse gap-3 bg-bg py-8 pr-6 even:pl-6 lg:py-12 lg:pl-8 lg:first:pl-0">
              <dt className="label-mono text-muted">{fact.label}</dt>
              <dd data-split="lines" className="font-serif text-fact font-medium text-ink tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create `components/sections/Practice.tsx`**

```tsx
import { site } from "@/content/site";

export function Practice() {
  const { practice } = site;
  return (
    <section id="practice" aria-labelledby="practice-title" className="section-y">
      <div className="shell">
        <h2 id="practice-title" data-reveal className="label-mono text-muted">{practice.label}</h2>
        <p data-split="words-scrub" className="mt-8 max-w-[22ch] font-serif text-statement text-ink">
          {practice.statement} <em className="italic text-brass">{practice.emphasis}</em>
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create `components/sections/Services.tsx`**

```tsx
import { site } from "@/content/site";

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="section-y">
      <div className="shell">
        <div className="flex items-baseline justify-between">
          <h2 id="services-title" data-reveal className="label-mono text-muted">Services</h2>
          <span aria-hidden className="label-mono text-muted">{String(site.services.length).padStart(2, "0")}</span>
        </div>
        <ul className="mt-8">
          {site.services.map((s) => (
            <li key={s.n}>
              <span data-line aria-hidden className="block h-px bg-line" />
              <a
                href="#contact"
                data-reveal
                className="svc-row grid grid-cols-[48px_1fr_24px] items-baseline gap-x-4 gap-y-2 py-6 lg:grid-cols-[96px_1fr_1.2fr_40px] lg:gap-x-6 lg:py-8"
              >
                <span className="label-mono text-muted">{s.n}</span>
                <h3 className="svc-title font-serif text-h3 font-medium text-ink">{s.title}</h3>
                <span aria-hidden className="svc-arrow col-start-3 row-start-1 justify-self-end text-muted lg:col-start-4">→</span>
                <p className="svc-summary col-start-2 text-body text-muted lg:col-start-3 lg:row-start-1">{s.summary}</p>
                <span className="sr-only"> — contact the partners about {s.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <span data-line aria-hidden className="block h-px bg-line" />
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Replace `app/page.tsx`**

```tsx
import { Facts } from "@/components/sections/Facts";
import { Hero } from "@/components/sections/Hero";
import { Practice } from "@/components/sections/Practice";
import { Services } from "@/components/sections/Services";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Facts />
      <Practice />
      <Services />
    </main>
  );
}
```

- [ ] **Step 9: Append hero styles to `app/globals.css`**

```css
@layer components {
  .hero { height: clamp(640px, 100svh, 1000px); }
  .hero-backdrop {
    background:
      radial-gradient(70% 45% at 50% 100%, rgb(201 169 110 / 0.1), transparent 70%),
      var(--color-bg);
  }
  .hero-corner { background: rgb(11 11 12 / 0.4); backdrop-filter: blur(8px); }
}
```

- [ ] **Step 10: Run unit + E2E tests**

Run: `npm test && npx playwright test tests/e2e/home.spec.ts`
Expected: PASS on both `desktop` and `mobile` projects (6 tests). If the spacing-scale test fails, fix the offending class — never widen the allow-list.

- [ ] **Step 11: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add hero, facts, practice and services sections with Playwright e2e

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 5: Process, Partners, Contact, Footer, Disclaimer page, SEO, link/button micro-interactions

**Files:**
- Create: `components/sections/Process.tsx`, `components/sections/Partners.tsx`, `components/sections/Contact.tsx`, `components/ui/CopyEmail.tsx`, `components/layout/Footer.tsx`, `components/seo/JsonLd.tsx`, `app/disclaimer/page.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/icon.svg`
- Modify: `app/page.tsx` (replace), `app/layout.tsx` (add Footer), `app/globals.css` (append)
- Delete: `app/favicon.ico`
- Test: `tests/e2e/home.spec.ts` (append), `tests/e2e/disclaimer.spec.ts`, `tests/e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `site`.
- Produces: `section#process[data-process]` with `[data-process-progress]`, `li[data-step]`, `[data-step-body]`; `section#partners` with `li[data-reveal]` cards, `[data-reveal="scale"]` tiles, `.partner-name`; `section#contact` with `h2[data-split="lines"]`, `span[data-magnetic]` wrapping the tel link; `<CopyEmail email className? />`; footer `p[data-split="chars"]` wordmark; CSS classes `.link-underline` and `.btn` (M13).

**Skills:** `animate` (press feedback values).

- [ ] **Step 1: Write the failing E2E tests**

Append to `tests/e2e/home.spec.ts`:
```ts
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
```

`tests/e2e/disclaimer.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("disclaimer page renders the full text", async ({ page }) => {
  await page.goto("/disclaimer");
  await expect(page.getByRole("heading", { level: 1, name: "Disclaimer" })).toBeVisible();
  await expect(page.locator("main p[data-reveal]")).toHaveCount(3);
  await expect(page).toHaveTitle(/Disclaimer · Firm Name & Co\./);
});
```

`tests/e2e/seo.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("robots, sitemap and JSON-LD are served", async ({ page, request }) => {
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/disclaimer");
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(ld ?? "{}")["@type"]).toBe("AccountingService");
});
```

- [ ] **Step 2: Run and confirm they fail**

Run: `npx playwright test tests/e2e`
Expected: the new tests FAIL (sections, page and routes missing).

- [ ] **Step 3: Create `components/sections/Process.tsx`**

```tsx
import { site } from "@/content/site";

export function Process() {
  return (
    <section id="process" data-process aria-labelledby="process-title" className="section-y">
      <div className="shell">
        <h2 id="process-title" data-reveal className="font-serif text-h2 text-ink">How we work</h2>
        <div aria-hidden className="mt-16 hidden h-px bg-line lg:block">
          <span data-process-progress className="block h-px origin-left bg-brass" />
        </div>
        <ol className="mt-12 grid gap-12 lg:mt-8 lg:grid-cols-4 lg:gap-6">
          {site.process.map((step) => (
            <li key={step.n} data-step>
              <span className="label-mono text-brass">{step.n}</span>
              <h3 className="mt-4 font-serif text-h3 font-medium text-ink">{step.title}</h3>
              <p data-step-body className="mt-3 max-w-[32ch] text-body text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `components/sections/Partners.tsx`**

```tsx
import { site } from "@/content/site";

const initials = (name: string) =>
  name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

export function Partners() {
  return (
    <section id="partners" aria-labelledby="partners-title" className="section-y">
      <div className="shell">
        <h2 id="partners-title" data-reveal className="font-serif text-h2 text-ink">Partners</h2>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {site.partners.map((p, i) => (
            <li key={`${p.name}-${i}`} data-reveal className="partner-card border border-line p-6">
              <div data-reveal="scale" aria-hidden className="grid aspect-square place-items-center border border-line font-serif text-h2 text-muted">
                {initials(p.name)}
              </div>
              <p className="mt-6 font-serif text-[24px] leading-tight text-ink">
                <span className="partner-name">{p.name}</span>
              </p>
              <p className="mt-2 label-mono text-brass">{p.credential}</p>
              <p className="mt-1 text-small text-muted">{p.focus}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `components/ui/CopyEmail.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

export function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <a href={`mailto:${email}`} className="link-underline text-body text-ink">{email}</a>
      <button type="button" onClick={copy} className="btn label-mono border border-line px-3 py-2 text-muted">
        <span key={String(copied)} className="copy-label inline-block">{copied ? "Copied" : "Copy email"}</span>
      </button>
      <span className="sr-only" aria-live="polite">{copied ? "Email address copied" : ""}</span>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/sections/Contact.tsx`**

```tsx
import { CopyEmail } from "@/components/ui/CopyEmail";
import { site } from "@/content/site";

export function Contact() {
  const { contact } = site;
  const tel = contact.phone.replace(/\s+/g, "");
  return (
    <section id="contact" aria-labelledby="contact-title" className="section-y border-t border-line">
      <div className="shell">
        <h2 id="contact-title" data-split="lines" className="max-w-[14ch] font-serif text-h2 text-ink">Contact the partners</h2>
        <div className="mt-12 grid gap-12 md:grid-cols-3 lg:mt-16">
          <div data-reveal>
            <h3 className="label-mono text-muted">Visit</h3>
            <address className="mt-4 text-body not-italic text-ink">
              {contact.address.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
            </address>
            <a href={contact.mapUrl} target="_blank" rel="noreferrer" className="link-underline mt-4 inline-block text-small text-muted">
              Open in Maps ↗
            </a>
          </div>
          <div data-reveal>
            <h3 className="label-mono text-muted">Call &amp; write</h3>
            {/* data-magnetic sits on a wrapper so the magnetic transform never overrides .btn:active */}
            <span data-magnetic className="mt-4 inline-block">
              <a href={`tel:${tel}`} className="btn inline-flex items-center gap-3 border border-ink px-6 py-4 text-ink">
                {contact.phone} <span aria-hidden>→</span>
              </a>
            </span>
            <CopyEmail email={contact.email} className="mt-6" />
          </div>
          <div data-reveal>
            <h3 className="label-mono text-muted">Hours</h3>
            <p className="mt-4 text-body text-ink">{contact.hours}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create `components/layout/Footer.tsx`**

```tsx
import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  const { firm, disclaimer } = site;
  return (
    <footer className="border-t border-line">
      <div className="shell section-y">
        <div className="grid gap-8 lg:grid-cols-2">
          <p className="max-w-[60ch] text-small text-muted">{disclaimer.short}</p>
          <nav aria-label="Footer" className="flex gap-6 lg:justify-end">
            <Link href="/disclaimer" className="link-underline label-mono text-muted">Disclaimer</Link>
            <a href="/#contact" className="link-underline label-mono text-muted">Contact</a>
          </nav>
        </div>
        <p data-split="chars" aria-hidden className="mt-16 font-serif text-wordmark font-medium break-words text-ink">{firm.name}</p>
        <p className="mt-8 label-mono text-muted">
          © {new Date().getFullYear()} {firm.name} · {firm.designation} · FRN {firm.frn}
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 8: Create `components/seo/JsonLd.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/icon.svg`**

```tsx
// components/seo/JsonLd.tsx
import { site } from "@/content/site";

export function JsonLd() {
  const { firm, contact } = site;
  const data = {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    name: firm.name,
    url: firm.url,
    telephone: contact.phone,
    email: contact.email,
    foundingDate: String(firm.established),
    address: { "@type": "PostalAddress", streetAddress: contact.address.join(", "), addressLocality: firm.city, addressCountry: "IN" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```
```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${site.firm.url}/sitemap.xml` };
}
```
```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.firm.url, changeFrequency: "yearly", priority: 1 },
    { url: `${site.firm.url}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
```
```svg
<!-- app/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0B0B0C"/><rect x="6.5" y="6.5" width="51" height="51" fill="none" stroke="#F1ECE4"/><text x="32" y="40" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#F1ECE4">F&amp;C</text></svg>
```
```bash
cd "/c/Users/satys/Desktop/auditor website" && rm -f app/favicon.ico
```

- [ ] **Step 9: Create `app/disclaimer/page.tsx`**

```tsx
import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Disclaimer", description: site.disclaimer.short };

export default function DisclaimerPage() {
  return (
    <main id="main" className="pt-32">
      <div className="shell section-y">
        <p className="label-mono text-muted">{site.firm.name}</p>
        <h1 data-split="lines" className="mt-6 font-serif text-h2 text-ink">Disclaimer</h1>
        <div className="mt-12 max-w-[65ch] space-y-6 text-body text-muted">
          {site.disclaimer.full.map((paragraph) => (
            <p key={paragraph} data-reveal>{paragraph}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Replace `app/page.tsx` and add the footer to `app/layout.tsx`**

```tsx
// app/page.tsx
import { Contact } from "@/components/sections/Contact";
import { Facts } from "@/components/sections/Facts";
import { Hero } from "@/components/sections/Hero";
import { Partners } from "@/components/sections/Partners";
import { Practice } from "@/components/sections/Practice";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { JsonLd } from "@/components/seo/JsonLd";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Facts />
      <Practice />
      <Services />
      <Process />
      <Partners />
      <Contact />
      <JsonLd />
    </main>
  );
}
```
In `app/layout.tsx` add `import { Footer } from "@/components/layout/Footer";` and render `<Footer />` right after `{children}` inside `<body>`.

- [ ] **Step 11: Append micro-interaction styles (M13) to `app/globals.css`**

```css
@layer components {
  .link-underline { position: relative; }
  .link-underline::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px;
    background: currentColor; transform: scaleX(0); transform-origin: left center;
    transition: transform var(--dur-ui) var(--ease-out);
  }
  .link-underline:focus-visible::after { transform: scaleX(1); }
  @media (hover: hover) and (pointer: fine) {
    .link-underline:hover::after { transform: scaleX(1); }
  }

  .btn { transition: transform var(--dur-press) var(--ease-out), border-color var(--dur-ui) var(--ease-out); }
  .btn:active { transform: scale(0.97); }

  .copy-label { animation: copy-in 160ms var(--ease-out); }
  @keyframes copy-in { from { opacity: 0; transform: translateY(4px); } }
}
```

- [ ] **Step 12: Run all tests**

Run: `npm test && npx playwright test`
Expected: all unit tests and all E2E tests PASS on both projects.

- [ ] **Step 13: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add process, partners, contact, footer, disclaimer page and SEO

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 6: Header and menu overlay (behaviour + accessibility, no animation yet)

**Files:**
- Create: `components/ui/Monogram.tsx`, `components/layout/SiteChrome.tsx`, `components/layout/Header.tsx`, `components/layout/MenuOverlay.tsx`
- Modify: `app/layout.tsx` (render `<SiteChrome />` before `{children}`), `app/globals.css` (append)
- Test: `tests/e2e/menu.spec.ts`

**Interfaces:**
- Consumes: `site`.
- Produces: `<SiteChrome />` (no props). `Header` props `{ menuOpen: boolean; onOpen: () => void; burgerRef: RefObject<HTMLButtonElement | null> }`, root `header[data-site-header][data-solid]` (+ `data-hero-fade` on `/`). `MenuOverlay` props `{ open: boolean; onClose: () => void; returnFocusTo: RefObject<HTMLButtonElement | null> }`, root `div#site-menu.menu-overlay[role=dialog]`, items `[data-menu-item]`, close button `[data-menu-close]`. `MENU_LINKS` array.

**Skills:** none.

- [ ] **Step 1: Write the failing E2E test** — `tests/e2e/menu.spec.ts`

```ts
import { expect, test } from "@playwright/test";

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
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx playwright test tests/e2e/menu.spec.ts`
Expected: FAIL — no "Open menu" button.

- [ ] **Step 3: Create `components/ui/Monogram.tsx`**

```tsx
import { site } from "@/content/site";

export function Monogram() {
  return (
    <span aria-hidden className="grid size-10 place-items-center border border-ink font-serif text-[15px] font-medium tracking-tight text-ink lg:size-12 lg:text-[18px]">
      {site.firm.monogram}
    </span>
  );
}
```

- [ ] **Step 4: Create `components/layout/Header.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";
import { Monogram } from "@/components/ui/Monogram";
import { site } from "@/content/site";

export type HeaderProps = {
  menuOpen: boolean;
  onOpen: () => void;
  burgerRef: RefObject<HTMLButtonElement | null>;
};

export function Header({ menuOpen, onOpen, burgerRef }: HeaderProps) {
  const pathname = usePathname();
  const { firm } = site;
  return (
    <header
      data-site-header
      data-solid="false"
      {...(pathname === "/" ? { "data-hero-fade": "" } : {})}
      inert={menuOpen}
      className="site-header fixed inset-x-0 top-0 z-40"
    >
      <div className="flex items-center justify-between px-(--gutter) py-6 lg:py-12">
        <Link href="/" className="flex items-center gap-4" aria-label={`${firm.name}, home`}>
          <Monogram />
          <span className="flex flex-col gap-1">
            <span className="font-serif text-[17px] font-medium tracking-tight text-ink lg:text-[20px]">{firm.name}</span>
            <span className="hidden font-mono text-[10px] tracking-[0.18em] text-muted uppercase lg:block">{firm.designation}</span>
          </span>
        </Link>
        <div className="flex h-12 border border-line lg:h-16">
          <div className="hidden flex-col justify-center gap-1 border-r border-line px-6 font-mono text-[10px] tracking-[0.18em] text-muted uppercase lg:flex">
            <span>FRN {firm.frn}</span>
            <span>Est. {firm.established}</span>
          </div>
          <button
            ref={burgerRef}
            type="button"
            onClick={onOpen}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className="burger grid w-12 place-items-center lg:w-16"
          >
            <span aria-hidden className="burger-lines" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create `components/layout/MenuOverlay.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { Monogram } from "@/components/ui/Monogram";
import { site } from "@/content/site";

export const MENU_LINKS = [
  { href: "/#practice", label: "Practice" },
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "How we work" },
  { href: "/#partners", label: "Partners" },
  { href: "/#contact", label: "Contact" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

export type MenuOverlayProps = {
  open: boolean;
  onClose: () => void;
  returnFocusTo: RefObject<HTMLButtonElement | null>;
};

export function MenuOverlay({ open, onClose, returnFocusTo }: MenuOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      wasOpen.current = true;
      el.querySelector<HTMLElement>("[data-menu-close]")?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      returnFocusTo.current?.focus();
    }
  }, [open, returnFocusTo]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>("a[href], button"));
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const tel = site.contact.phone.replace(/\s+/g, "");
  return (
    <div
      ref={ref}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      hidden={!open}
      onKeyDown={onKeyDown}
      className="menu-overlay fixed inset-0 z-50 flex flex-col bg-surface"
    >
      <div className="flex items-center justify-between px-(--gutter) py-6 lg:py-12">
        <span className="flex items-center gap-4">
          <Monogram />
          <span className="font-serif text-[17px] font-medium text-ink lg:text-[20px]">{site.firm.name}</span>
        </span>
        <button
          type="button"
          data-menu-close
          onClick={onClose}
          aria-label="Close menu"
          className="burger is-close grid size-12 place-items-center border border-line lg:size-16"
        >
          <span aria-hidden className="burger-lines" />
        </button>
      </div>
      <nav aria-label="Primary" className="shell flex flex-1 flex-col justify-center">
        <ul className="space-y-2">
          {MENU_LINKS.map((link) => (
            <li key={link.href} data-menu-item>
              {link.href.includes("#") ? (
                <a href={link.href} onClick={onClose} className="inline-block font-serif text-h2 text-ink">{link.label}</a>
              ) : (
                <Link href={link.href} onClick={onClose} className="inline-block font-serif text-h2 text-ink">{link.label}</Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div data-menu-item className="shell flex flex-wrap gap-x-8 gap-y-2 pb-12 label-mono text-muted">
        <a href={`tel:${tel}`} className="link-underline">{site.contact.phone}</a>
        <a href={`mailto:${site.contact.email}`} className="link-underline">{site.contact.email}</a>
      </div>
    </div>
  );
}
```
Hash links are plain `<a>` on purpose: Task 7's MotionProvider turns same-page hash clicks into Lenis scrolls.

- [ ] **Step 6: Create `components/layout/SiteChrome.tsx`**

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Header } from "./Header";
import { MenuOverlay } from "./MenuOverlay";

export function SiteChrome() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  return (
    <>
      <Header menuOpen={open} onOpen={openMenu} burgerRef={burgerRef} />
      <MenuOverlay open={open} onClose={closeMenu} returnFocusTo={burgerRef} />
    </>
  );
}
```
In `app/layout.tsx`: `import { SiteChrome } from "@/components/layout/SiteChrome";` and render `<SiteChrome />` directly before `{children}`.

- [ ] **Step 7: Append header/burger styles to `app/globals.css`**

```css
@layer components {
  .site-header { transition: background-color var(--dur-ui) var(--ease-out); }
  .site-header[data-solid="true"] {
    background: rgb(18 18 20 / 0.8);
    backdrop-filter: blur(8px);
    box-shadow: inset 0 -1px 0 var(--color-line);
  }
  .burger-lines { position: relative; display: block; width: 20px; height: 1px; }
  .burger-lines::before, .burger-lines::after {
    content: ""; position: absolute; left: 0; width: 20px; height: 1px; background: var(--color-ink);
    transition: transform var(--dur-ui) var(--ease-out);
  }
  .burger-lines::before { transform: translateY(-4px); }
  .burger-lines::after { transform: translateY(4px); }
  .is-close .burger-lines::before { transform: rotate(45deg); }
  .is-close .burger-lines::after { transform: rotate(-45deg); }
}
```

- [ ] **Step 8: Run tests**

Run: `npm test && npx playwright test`
Expected: all PASS (menu tests on both projects).

- [ ] **Step 9: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add accessible header and menu overlay

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 7: Motion foundation — GSAP registration, Lenis smooth scroll, motion boot

**Files:**
- Create: `lib/gsap.ts`, `components/motion/motion-env.ts`, `components/motion/MotionProvider.tsx`
- Modify: `app/layout.tsx` (boot script, Lenis CSS, wrap body content in `MotionProvider`)
- Test: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `easePoints` from `@/lib/motion`.
- Produces: `import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap"` (plugins registered, CustomEase ids `"ui-out"` and `"ui-in-out"`, `ScrollTrigger.config({ ignoreMobileResize: true })`); `isMotionOk(): boolean`; `<MotionProvider>`; `useLenis(): Lenis | null`. `<html>` classes: `js`, `motion-ok` (motion allowed), `motion-ready` (hydrated), `lenis` (Lenis active).

**Skills:** `gsap-react`, `gsap-scrolltrigger` (sections on scrollerProxy/smooth scrolling), `gsap-performance`, `gsap-plugins` (CustomEase).

- [ ] **Step 1: Write the failing E2E test** — `tests/e2e/motion.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test("smooth scrolling is active when motion is allowed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel smoothing is a desktop concern");
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveClass(/\bmotion-ok\b/);
  await expect(html).toHaveClass(/\bmotion-ready\b/);
  await expect(html).toHaveClass(/\blenis\b/);
});

test("reduced motion keeps native scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveClass(/\bmotion-ready\b/);
  await expect(html).not.toHaveClass(/\bmotion-ok\b/);
  await expect(html).not.toHaveClass(/\blenis\b/);
});

test("in-page anchors scroll to their section and update the URL", async ({ page }) => {
  await page.goto("/");
  await page.locator("a.hero-corner").click();
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page).toHaveURL(/#contact$/);
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx playwright test tests/e2e/motion.spec.ts`
Expected: FAIL — `motion-ok` / `lenis` classes missing.

- [ ] **Step 3: Create `lib/gsap.ts`**

```ts
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { easePoints } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  CustomEase.create("ui-out", easePoints.out);
  CustomEase.create("ui-in-out", easePoints.inOut);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
```

- [ ] **Step 4: Create `components/motion/motion-env.ts`**

```ts
/** True when the boot script allowed motion (no reduced-motion preference) and JS is running. */
export function isMotionOk(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("motion-ok");
}
```

- [ ] **Step 5: Create `components/motion/MotionProvider.tsx`**

```tsx
"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("motion-ready");
    if (!root.classList.contains("motion-ok")) return;

    const instance = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Same-page hash links → smooth Lenis scroll (force: works while the menu has Lenis stopped).
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!link || link.origin !== location.origin || link.pathname !== location.pathname || !link.hash) return;
      const target = document.querySelector<HTMLElement>(link.hash);
      if (!target) return;
      event.preventDefault();
      instance.scrollTo(target, { force: true });
      history.pushState(null, "", link.hash);
    };
    document.addEventListener("click", onClick);
    setLenis(instance);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // After client-side route changes, jump to the hash (or top) and re-measure triggers.
  useEffect(() => {
    if (!lenis || lastPath.current === pathname) return;
    lastPath.current = pathname;
    lenis.scrollTo(location.hash || 0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
```

- [ ] **Step 6: Update `app/layout.tsx`**

Add the imports and boot script, and wrap the body content:
```tsx
import "lenis/dist/lenis.css";
import { MotionProvider } from "@/components/motion/MotionProvider";

// Runs before first paint: `motion-ok` hides animated elements until controllers reveal them.
// If hydration never happens (`motion-ready` missing after 4 s) the content is shown anyway.
const MOTION_BOOT = `(function(){var d=document.documentElement;d.classList.add("js");if(window.matchMedia&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("motion-ok");setTimeout(function(){if(!d.classList.contains("motion-ready"))d.classList.remove("motion-ok")},4000)}})();`;
```
```tsx
<html lang="en-IN" className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable}`} suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
  </head>
  <body className="bg-bg font-sans text-ink antialiased">
    <a href="#main" className="skip-link">Skip to content</a>
    <MotionProvider>
      <SiteChrome />
      {children}
      <Footer />
    </MotionProvider>
  </body>
</html>
```

- [ ] **Step 7: Run tests**

Run: `npm test && npx playwright test`
Expected: all PASS, including the earlier menu test ("Partners" link now scrolls smoothly; `toBeInViewport` waits for it).

- [ ] **Step 8: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add Lenis smooth scrolling driven by the GSAP ticker

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 8: Reveal, split-text and hero-text motion (M1 text, M2 copy, M3–M6, M10 heading, M14)

**Files:**
- Create: `components/motion/PageMotion.tsx`, `components/motion/HeroMotion.tsx`
- Modify: `app/layout.tsx` (render `<PageMotion />` inside `MotionProvider`, after `<Footer />`), `app/page.tsx` (render `<HeroMotion />` after `<JsonLd />`), `app/globals.css` (append)
- Test: `tests/e2e/reveal.spec.ts`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `SplitText`, `useGSAP` from `@/lib/gsap`; `dur`, `stagger` from `@/lib/motion`; `isMotionOk`; the data attributes from Tasks 4–6.
- Produces: `<PageMotion />` (layout-level, re-runs on route change) handling `[data-reveal]`, `[data-reveal="scale"]`, `[data-line]`, `[data-split="intro" | "lines" | "chars" | "words-scrub"]`; `<HeroMotion />` handling `[data-hero-fade]` and `.hero-copy` scroll-out.

**Skills:** `gsap-react`, `gsap-scrolltrigger` (batch, scrub), `gsap-plugins` (SplitText: `autoSplit`, `onSplit`, `mask`), `animate`, `animation-performance`.

- [ ] **Step 1: Write the failing E2E test** — `tests/e2e/reveal.spec.ts`

```ts
import { expect, test, type Page } from "@playwright/test";

async function scrollThroughPage(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);
}

const notFullyVisible = (selector: string) => (els: Element[]) =>
  els.filter((el) => getComputedStyle(el).opacity !== "1").map((el) => `${selector}: ${el.textContent?.slice(0, 30)}`);

test("every revealed element ends fully visible after scrolling", async ({ page }) => {
  await page.goto("/");
  await scrollThroughPage(page);
  expect(await page.$$eval("[data-reveal]", notFullyVisible("[data-reveal]"))).toEqual([]);
  const hiddenSplits = await page.$$eval("[data-split]", (els) => els.filter((el) => getComputedStyle(el).visibility === "hidden").length);
  expect(hiddenSplits).toBe(0);
});

test("reduced motion shows everything immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.$$eval("[data-reveal], [data-hero-fade]", notFullyVisible("reduced"))).toEqual([]);
  const hiddenSplits = await page.$$eval("[data-split]", (els) => els.filter((el) => getComputedStyle(el).visibility === "hidden").length);
  expect(hiddenSplits).toBe(0);
});

test("hero headline finishes its intro within the 1.2 s budget", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.waitForTimeout(1300);
  const moving = await page.$$eval("#hero-title *", (els) =>
    els.filter((el) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(el).transform)).length,
  );
  expect(moving).toBe(0);
});
```

- [ ] **Step 2: Append initial motion states to `app/globals.css`** (they apply only when the boot script set `motion-ok`)

```css
.motion-ok [data-reveal] { opacity: 0; transform: translateY(24px); }
.motion-ok [data-reveal="scale"] { transform: scale(0.96); }
.motion-ok [data-line] { transform: scaleX(0); transform-origin: left center; }
.motion-ok [data-split] { visibility: hidden; }
.motion-ok [data-hero-fade] { opacity: 0; transform: translateY(12px); }
```

- [ ] **Step 3: Run the test and confirm it fails**

Run: `npx playwright test tests/e2e/reveal.spec.ts`
Expected: FAIL — elements stay hidden (no controllers yet). The reduced-motion test should already PASS.

- [ ] **Step 4: Create `components/motion/PageMotion.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { dur, stagger } from "@/lib/motion";
import { isMotionOk } from "./motion-env";

type SplitMode = "intro" | "lines" | "chars" | "words-scrub";

function animateSplit(el: HTMLElement, mode: SplitMode, self: SplitText) {
  el.style.visibility = "visible";
  switch (mode) {
    case "words-scrub": // M6 — words light up as the statement is read
      return gsap.fromTo(self.words, { opacity: 0.18 }, {
        opacity: 1, ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 60%", scrub: true },
      });
    case "chars": // M14 — footer wordmark
      return gsap.from(self.chars, {
        yPercent: 100, duration: 1, ease: "expo.out", stagger: stagger.chars,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    case "intro": // M1 — hero headline, budget ≤ 1.2 s after fonts are ready
      return gsap.from(self.lines, { yPercent: 110, duration: dur.heroLines, ease: "expo.out", stagger: stagger.editorial, delay: 0.1 });
    default: // M5 / M10 — line mask reveals
      return gsap.from(self.lines, {
        yPercent: 110, duration: dur.lines, ease: "expo.out", stagger: stagger.editorial,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
  }
}

export function PageMotion() {
  const pathname = usePathname();

  useGSAP(
    (_context, contextSafe) => {
      if (!isMotionOk() || !contextSafe) return;

      // M3 / M9 — blocks fade up (cards also scale from 0.96 via CSS initial state)
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 85%",
        once: true,
        onEnter: (els) =>
          gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: dur.editorial, ease: "expo.out", stagger: stagger.editorial, overwrite: true }),
      });

      // M4 — hairlines draw from the left
      ScrollTrigger.batch("[data-line]", {
        start: "top 90%",
        once: true,
        onEnter: (els) => gsap.to(els, { scaleX: 1, duration: 1, ease: "expo.out", stagger: stagger.editorial }),
      });

      const splitAll = contextSafe(() => {
        document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
          const mode = (el.dataset.split ?? "lines") as SplitMode;
          SplitText.create(el, {
            type: mode === "chars" ? "lines,chars" : mode === "words-scrub" ? "words" : "lines",
            ...(mode === "words-scrub" ? {} : { mask: "lines" as const }),
            autoSplit: true,
            onSplit: (self: SplitText) => animateSplit(el, mode, self),
          });
        });
        ScrollTrigger.refresh();
      });
      document.fonts.ready.then(splitAll);
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
```

- [ ] **Step 5: Create `components/motion/HeroMotion.tsx`**

```tsx
"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { dur, stagger } from "@/lib/motion";
import { isMotionOk } from "./motion-env";

export function HeroMotion() {
  useGSAP((_context, contextSafe) => {
    if (!isMotionOk() || !contextSafe) return;

    // M1 — eyebrow, sub, header and corner box fade up after fonts are ready
    const intro = contextSafe(() => {
      gsap.to("[data-hero-fade]", {
        opacity: 1, y: 0, duration: dur.heroFade, ease: "expo.out", stagger: stagger.heroFade, delay: 0.1,
        onComplete: () => document.querySelectorAll("[data-hero-fade]").forEach((el) => el.removeAttribute("data-hero-fade")),
      });
    });
    document.fonts.ready.then(intro);

    // M2 (copy) — hero text drifts up and fades by 60 % of the hero scroll
    gsap.to(".hero-copy", {
      y: -80, opacity: 0, ease: "none",
      scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "60% top", scrub: true },
    });
  });

  return null;
}
```

- [ ] **Step 6: Mount the controllers**

`app/layout.tsx`: `import { PageMotion } from "@/components/motion/PageMotion";` and render `<PageMotion />` inside `<MotionProvider>` after `<Footer />`.
`app/page.tsx`: `import { HeroMotion } from "@/components/motion/HeroMotion";` and render `<HeroMotion />` after `<JsonLd />`.

- [ ] **Step 7: Run tests**

Run: `npm test && npx playwright test`
Expected: all PASS. If the 1.2 s headline test fails, check that the intro split uses `dur.heroLines` (0.95 s) and `delay: 0.1`.

- [ ] **Step 8: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add scroll reveals, split-text reveals and hero text intro

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 9: Interaction motion — header (M11), menu (M12), hovers (M7, M9), magnetic (M10), process pin (M8)

**Files:**
- Create: `components/layout/header-state.ts`, `components/motion/MagneticController.tsx`, `components/motion/ProcessMotion.tsx`
- Modify (replace whole file): `components/layout/Header.tsx`, `components/layout/MenuOverlay.tsx`
- Modify: `app/layout.tsx` (render `<MagneticController />` after `<PageMotion />`), `app/page.tsx` (render `<ProcessMotion />` after `<HeroMotion />`), `app/globals.css` (append)
- Test: `tests/unit/header-state.test.ts`, `tests/e2e/interactions.spec.ts`

**Interfaces:**
- Consumes: `useLenis` (Task 7), `gsap`/`ScrollTrigger`/`useGSAP`, `dur`, `stagger`, `isMotionOk`, Task 6 props (unchanged).
- Produces: `nextHeaderState(input: HeaderInput, prev: HeaderState): HeaderState`, `type HeaderInput = { y: number; lastY: number; menuOpen: boolean; focusInside: boolean; heroHeight: number }`, `type HeaderState = { hidden: boolean; solid: boolean }`, constants `HIDE_AFTER = 120`, `JITTER = 4`, `HEADER_DURATION = 0.3`; `<MagneticController />`; `<ProcessMotion />`.

**Skills:** `gsap-scrolltrigger` (pin, `anticipatePin`, `gsap.matchMedia`), `gsap-timeline`, `gsap-utils` (`quickTo`, `clamp`), `animate`, `review-animations`.

- [ ] **Step 1: Write the failing unit test** — `tests/unit/header-state.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { nextHeaderState, type HeaderInput } from "@/components/layout/header-state";

const base: HeaderInput = { y: 0, lastY: 0, menuOpen: false, focusInside: false, heroHeight: 900 };
const shown = { hidden: false, solid: false };

describe("nextHeaderState", () => {
  it("stays visible near the top", () => {
    expect(nextHeaderState({ ...base, y: 100, lastY: 50 }, shown)).toEqual({ hidden: false, solid: false });
  });
  it("hides when scrolling down past 120px", () => {
    expect(nextHeaderState({ ...base, y: 400, lastY: 300 }, shown).hidden).toBe(true);
  });
  it("shows again when scrolling up", () => {
    expect(nextHeaderState({ ...base, y: 300, lastY: 400 }, { hidden: true, solid: false }).hidden).toBe(false);
  });
  it("ignores jitter smaller than 4px", () => {
    expect(nextHeaderState({ ...base, y: 402, lastY: 400 }, { hidden: true, solid: false }).hidden).toBe(true);
  });
  it("never hides while the menu is open", () => {
    expect(nextHeaderState({ ...base, y: 800, lastY: 500, menuOpen: true }, shown).hidden).toBe(false);
  });
  it("never hides while focus is inside the header", () => {
    expect(nextHeaderState({ ...base, y: 800, lastY: 500, focusInside: true }, shown).hidden).toBe(false);
  });
  it("turns solid once the hero has scrolled past", () => {
    expect(nextHeaderState({ ...base, y: 820, lastY: 800 }, shown).solid).toBe(true);
    expect(nextHeaderState({ ...base, y: 700, lastY: 690 }, shown).solid).toBe(false);
  });
  it("turns solid on pages without a hero as soon as they scroll", () => {
    expect(nextHeaderState({ ...base, heroHeight: 0, y: 10, lastY: 0 }, shown).solid).toBe(true);
  });
});
```

- [ ] **Step 2: Write the failing E2E test** — `tests/e2e/interactions.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test("header hides on scroll down, returns on scroll up, turns solid after the hero", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "wheel-driven");
  await page.goto("/");
  const header = page.locator("[data-site-header]");
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1400);
  await expect(header).toHaveAttribute("data-solid", "true");
  await expect(header).toHaveCSS("transform", /matrix\(1, 0, 0, 1, 0, -\d+(\.\d+)?\)/);
  await page.mouse.wheel(0, -300);
  await expect(header).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
});

test("process section pins on desktop only", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".pin-spacer [data-process]")).toHaveCount(testInfo.project.name === "desktop" ? 1 : 0);
});

test("reduced motion never pins", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(500);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("service rows respond to hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "hover needs a fine pointer");
  await page.goto("/");
  const row = page.locator(".svc-row").first();
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await expect(row.locator(".svc-title")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 8, 0)");
});
```

- [ ] **Step 3: Run both and confirm they fail**

Run: `npm test -- tests/unit/header-state.test.ts && npx playwright test tests/e2e/interactions.spec.ts`
Expected: FAIL (module missing; no pin, no hide, no hover transform).

- [ ] **Step 4: Create `components/layout/header-state.ts`**

```ts
export type HeaderInput = { y: number; lastY: number; menuOpen: boolean; focusInside: boolean; heroHeight: number };
export type HeaderState = { hidden: boolean; solid: boolean };

export const HIDE_AFTER = 120;
export const JITTER = 4;
export const HEADER_DURATION = 0.3;

/** M11 — decide header visibility and background from the scroll position. */
export function nextHeaderState(input: HeaderInput, prev: HeaderState): HeaderState {
  const solid = input.y > Math.max(0, input.heroHeight - 96);
  if (input.menuOpen || input.focusInside || input.y < HIDE_AFTER) return { hidden: false, solid };
  const delta = input.y - input.lastY;
  if (Math.abs(delta) < JITTER) return { hidden: prev.hidden, solid };
  return { hidden: delta > 0, solid };
}
```

- [ ] **Step 5: Replace `components/layout/Header.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type RefObject } from "react";
import { isMotionOk } from "@/components/motion/motion-env";
import { Monogram } from "@/components/ui/Monogram";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { HEADER_DURATION, nextHeaderState, type HeaderState } from "./header-state";

export type HeaderProps = {
  menuOpen: boolean;
  onOpen: () => void;
  burgerRef: RefObject<HTMLButtonElement | null>;
};

export function Header({ menuOpen, onOpen, burgerRef }: HeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const menuOpenRef = useRef(menuOpen);
  const pathname = usePathname();
  const { firm } = site;

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const motion = isMotionOk();
      let state: HeaderState = { hidden: false, solid: false };
      let lastY = window.scrollY;
      let heroHeight = 0;
      const measure = () => {
        heroHeight = document.querySelector<HTMLElement>("[data-hero]")?.offsetHeight ?? 0;
      };
      const apply = (next: HeaderState) => {
        if (next.solid !== state.solid) el.dataset.solid = String(next.solid);
        if (motion && next.hidden !== state.hidden) {
          gsap.to(el, { yPercent: next.hidden ? -100 : 0, duration: HEADER_DURATION, ease: "ui-in-out", overwrite: "auto" });
        }
        state = next;
      };
      const update = (y: number) => {
        apply(nextHeaderState({ y, lastY, menuOpen: menuOpenRef.current, focusInside: el.contains(document.activeElement), heroHeight }, state));
        lastY = y;
      };
      measure();
      update(window.scrollY);
      ScrollTrigger.create({ start: 0, end: "max", onRefresh: measure, onUpdate: (self) => update(self.scroll()) });
    },
    { scope: ref, dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <header
      ref={ref}
      data-site-header
      data-solid="false"
      {...(pathname === "/" ? { "data-hero-fade": "" } : {})}
      inert={menuOpen}
      className="site-header fixed inset-x-0 top-0 z-40"
    >
      <div className="flex items-center justify-between px-(--gutter) py-6 lg:py-12">
        <Link href="/" className="flex items-center gap-4" aria-label={`${firm.name}, home`}>
          <Monogram />
          <span className="flex flex-col gap-1">
            <span className="font-serif text-[17px] font-medium tracking-tight text-ink lg:text-[20px]">{firm.name}</span>
            <span className="hidden font-mono text-[10px] tracking-[0.18em] text-muted uppercase lg:block">{firm.designation}</span>
          </span>
        </Link>
        <div className="flex h-12 border border-line lg:h-16">
          <div className="hidden flex-col justify-center gap-1 border-r border-line px-6 font-mono text-[10px] tracking-[0.18em] text-muted uppercase lg:flex">
            <span>FRN {firm.frn}</span>
            <span>Est. {firm.established}</span>
          </div>
          <button
            ref={burgerRef}
            type="button"
            onClick={onOpen}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className="burger grid w-12 place-items-center lg:w-16"
          >
            <span aria-hidden className="burger-lines" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Replace `components/layout/MenuOverlay.tsx`** (adds the M12 timeline and Lenis stop/start; markup unchanged except the `hidden` attribute is gone — GSAP owns visibility)

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { isMotionOk } from "@/components/motion/motion-env";
import { useLenis } from "@/components/motion/MotionProvider";
import { Monogram } from "@/components/ui/Monogram";
import { site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { dur, stagger } from "@/lib/motion";

export const MENU_LINKS = [
  { href: "/#practice", label: "Practice" },
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "How we work" },
  { href: "/#partners", label: "Partners" },
  { href: "/#contact", label: "Contact" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

export type MenuOverlayProps = {
  open: boolean;
  onClose: () => void;
  returnFocusTo: RefObject<HTMLButtonElement | null>;
};

export function MenuOverlay({ open, onClose, returnFocusTo }: MenuOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const wasOpen = useRef(false);
  const lenis = useLenis();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const motion = isMotionOk();
      gsap.set(el, { visibility: "hidden", clipPath: "inset(0% 0% 100% 0%)" });
      timeline.current = gsap
        .timeline({ paused: true, onReverseComplete: () => void gsap.set(el, { visibility: "hidden" }) })
        .to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: motion ? dur.overlay : 0, ease: "ui-in-out" })
        .from(
          el.querySelectorAll("[data-menu-item]"),
          { y: 24, opacity: 0, duration: motion ? 0.6 : 0, ease: "expo.out", stagger: motion ? stagger.ui : 0 },
          motion ? 0.15 : 0,
        );
    },
    { scope: ref },
  );

  useEffect(() => {
    const el = ref.current;
    const tl = timeline.current;
    if (!el || !tl) return;
    if (open) {
      wasOpen.current = true;
      lenis?.stop();
      gsap.set(el, { visibility: "visible" });
      tl.timeScale(1).play();
      el.querySelector<HTMLElement>("[data-menu-close]")?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (tl.duration() === 0) {
        tl.pause(0);
        gsap.set(el, { visibility: "hidden" });
      } else {
        tl.timeScale(tl.duration() / dur.overlayClose).reverse();
      }
      lenis?.start();
      returnFocusTo.current?.focus();
    }
  }, [open, lenis, returnFocusTo]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>("a[href], button"));
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const tel = site.contact.phone.replace(/\s+/g, "");
  return (
    <div
      ref={ref}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      onKeyDown={onKeyDown}
      className="menu-overlay fixed inset-0 z-50 flex flex-col bg-surface"
    >
      <div className="flex items-center justify-between px-(--gutter) py-6 lg:py-12">
        <span className="flex items-center gap-4">
          <Monogram />
          <span className="font-serif text-[17px] font-medium text-ink lg:text-[20px]">{site.firm.name}</span>
        </span>
        <button
          type="button"
          data-menu-close
          onClick={onClose}
          aria-label="Close menu"
          className="burger is-close grid size-12 place-items-center border border-line lg:size-16"
        >
          <span aria-hidden className="burger-lines" />
        </button>
      </div>
      <nav aria-label="Primary" className="shell flex flex-1 flex-col justify-center">
        <ul className="space-y-2">
          {MENU_LINKS.map((link) => (
            <li key={link.href} data-menu-item>
              {link.href.includes("#") ? (
                <a href={link.href} onClick={onClose} className="inline-block font-serif text-h2 text-ink">{link.label}</a>
              ) : (
                <Link href={link.href} onClick={onClose} className="inline-block font-serif text-h2 text-ink">{link.label}</Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div data-menu-item className="shell flex flex-wrap gap-x-8 gap-y-2 pb-12 label-mono text-muted">
        <a href={`tel:${tel}`} className="link-underline">{site.contact.phone}</a>
        <a href={`mailto:${site.contact.email}`} className="link-underline">{site.contact.email}</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create `components/motion/MagneticController.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { isMotionOk } from "./motion-env";

const STRENGTH = 8; // px, spec M10

export function MagneticController() {
  const pathname = usePathname();

  useGSAP(
    () => {
      if (!isMotionOk() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const cleanups = gsap.utils.toArray<HTMLElement>("[data-magnetic]").map((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.3, ease: "ui-out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.3, ease: "ui-out" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          xTo(gsap.utils.clamp(-1, 1, (e.clientX - r.left - r.width / 2) / (r.width / 2)) * STRENGTH);
          yTo(gsap.utils.clamp(-1, 1, (e.clientY - r.top - r.height / 2) / (r.height / 2)) * STRENGTH);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        };
      });
      return () => cleanups.forEach((fn) => fn());
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
```

- [ ] **Step 8: Create `components/motion/ProcessMotion.tsx`**

```tsx
"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { dur, stagger } from "@/lib/motion";
import { isMotionOk } from "./motion-env";

export function ProcessMotion() {
  useGSAP(() => {
    if (!isMotionOk()) return;
    const section = document.querySelector<HTMLElement>("[data-process]");
    if (!section) return;
    const steps = gsap.utils.toArray<HTMLElement>("[data-step]", section);
    const bodies = gsap.utils.toArray<HTMLElement>("[data-step-body]", section);
    const progress = section.querySelector<HTMLElement>("[data-process-progress]");
    const mm = gsap.matchMedia();

    // M8 desktop — pin the section and scrub through the steps
    mm.add("(min-width: 1024px)", () => {
      gsap.set(steps.slice(1), { opacity: 0.35 });
      gsap.set(bodies.slice(1), { opacity: 0, y: 16 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=200%", pin: true, scrub: true, anticipatePin: 1 },
      });
      if (progress) tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: steps.length - 1 }, 0);
      steps.forEach((step, i) => {
        if (i === 0) return;
        const at = i - 0.5;
        tl.to(steps[i - 1], { opacity: 0.35, duration: 0.3 }, at)
          .to(step, { opacity: 1, duration: 0.3 }, at)
          .to(bodies[i], { opacity: 1, y: 0, duration: 0.3 }, at);
      });
    });

    // M8 mobile — no pin; steps reveal like other blocks
    mm.add("(max-width: 1023.98px)", () => {
      gsap.set(steps, { opacity: 0, y: 24 });
      ScrollTrigger.batch(steps, {
        start: "top 85%",
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: dur.editorial, ease: "expo.out", stagger: stagger.editorial }),
      });
    });

    return () => mm.revert();
  });

  return null;
}
```

- [ ] **Step 9: Mount the controllers**

`app/layout.tsx`: `import { MagneticController } from "@/components/motion/MagneticController";` and render `<MagneticController />` after `<PageMotion />`.
`app/page.tsx`: `import { ProcessMotion } from "@/components/motion/ProcessMotion";` and render `<ProcessMotion />` after `<HeroMotion />`.

- [ ] **Step 10: Append hover and overlay styles to `app/globals.css`**

```css
@layer components {
  .menu-overlay { visibility: hidden; clip-path: inset(0 0 100% 0); } /* no flash before hydration */

  .svc-row { position: relative; }
  .svc-row::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background: rgb(241 236 228 / 0.03); opacity: 0; transition: opacity var(--dur-ui) var(--ease-out);
  }
  .svc-title, .svc-arrow { transition: transform var(--dur-ui) var(--ease-out); }
  .svc-summary { transition: color var(--dur-ui) var(--ease-out); }
  .svc-arrow { display: inline-block; transform: rotate(-45deg); }
  .svc-row:focus-visible::before { opacity: 1; }
  .svc-row:focus-visible .svc-summary { color: var(--color-ink); }

  .partner-name { position: relative; }
  .partner-name::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px; background: currentColor;
    transform: scaleX(0); transform-origin: left center; transition: transform var(--dur-ui) var(--ease-out);
  }

  @media (hover: hover) and (pointer: fine) {
    .svc-row:hover::before { opacity: 1; }
    .svc-row:hover .svc-summary { color: var(--color-ink); }
  }
  @media (prefers-reduced-motion: no-preference) {
    .svc-row:focus-visible .svc-title { transform: translateX(8px); }
    .svc-row:focus-visible .svc-arrow { transform: translateX(4px) rotate(0deg); }
    @media (hover: hover) and (pointer: fine) {
      .svc-row:hover .svc-title { transform: translateX(8px); }
      .svc-row:hover .svc-arrow { transform: translateX(4px) rotate(0deg); }
      .partner-card:hover .partner-name::after { transform: scaleX(1); }
    }
  }
}
```

- [ ] **Step 11: Run all tests**

Run: `npm test && npx playwright test`
Expected: all PASS — including Task 6's menu tests (dialog now hides via GSAP `visibility`).

- [ ] **Step 12: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add header hide/show, menu overlay motion, hovers, magnetic CTA and pinned process

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 10: 3D hero — tiers, ledger scene, canvas, book intro (M1 3D) and scroll fold (M2 3D)

**Files:**
- Create: `components/hero/tier.ts`, `components/hero/ledger-math.ts`, `components/hero/LedgerScene.tsx`, `components/hero/HeroCanvas.tsx`, `components/hero/HeroStage.tsx`
- Modify: `components/sections/Hero.tsx` (render `<HeroStage />` as the first child after `.hero-backdrop`), `app/globals.css` (append)
- Test: `tests/unit/hero-tier.test.ts`, `tests/unit/ledger-math.test.ts`, `tests/e2e/hero.spec.ts`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `useGSAP`; `dur.bookOpen`, `dur.light`, `stagger.pages`.
- Produces: `type HeroTier = "poster" | "full" | "lite"`, `type TierEnv`, `decideHeroTier(env: TierEnv): HeroTier`, `readTierEnv(): TierEnv`; `PAGE_COUNT`, `CLOSED_ANGLE`, `OPEN_ANGLE`, `BREATH`, `restAngle(i, count?)`, `pageAngle(rest, open, scroll, t, i)`; `type SceneDrivers`; default export `HeroCanvas({ tier, capture })`; `<HeroStage />`. DOM contract: `[data-hero]` gets `data-tier="poster|full|lite"` and, after the second rendered frame, `data-hero-ready="true"`; canvas wrapper `div.hero-canvas` is a direct child of `[data-hero]`; `?capture=1` adds class `capture` to `<html>`, forces the `full` tier, opens the book instantly and freezes time.

**Skills:** `threejs-react-three-fiber`, `threejs-fundamentals`, `threejs-geometry` (instancing), `threejs-lighting`, `threejs-materials`, `threejs-performance`, `gsap-react`.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/hero-tier.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { decideHeroTier, type TierEnv } from "@/components/hero/tier";

const capable: TierEnv = { reducedMotion: false, webgl: true, deviceMemory: 8, saveData: false, finePointer: true, width: 1440 };

describe("decideHeroTier", () => {
  it.each<[string, TierEnv, string]>([
    ["desktop", capable, "full"],
    ["narrow desktop window", { ...capable, width: 900 }, "lite"],
    ["phone", { ...capable, finePointer: false, width: 390, deviceMemory: 4 }, "lite"],
    ["unknown memory", { ...capable, deviceMemory: undefined }, "full"],
    ["reduced motion", { ...capable, reducedMotion: true }, "poster"],
    ["no WebGL", { ...capable, webgl: false }, "poster"],
    ["data saver", { ...capable, saveData: true }, "poster"],
    ["2 GB device", { ...capable, deviceMemory: 2 }, "poster"],
  ])("%s", (_name, env, expected) => {
    expect(decideHeroTier(env)).toBe(expected);
  });
});
```

`tests/unit/ledger-math.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { BREATH, CLOSED_ANGLE, OPEN_ANGLE, PAGE_COUNT, pageAngle, restAngle } from "@/components/hero/ledger-math";

describe("restAngle", () => {
  it("spans from the right cover to the left cover", () => {
    expect(restAngle(0)).toBeCloseTo(CLOSED_ANGLE);
    expect(restAngle(PAGE_COUNT - 1)).toBeCloseTo(OPEN_ANGLE);
  });
  it("increases page by page", () => {
    for (let i = 1; i < PAGE_COUNT; i++) expect(restAngle(i)).toBeGreaterThan(restAngle(i - 1));
  });
});

describe("pageAngle", () => {
  it("keeps pages closed before the intro", () => {
    expect(pageAngle(restAngle(20), 0, 0, 3, 20)).toBeCloseTo(CLOSED_ANGLE);
  });
  it("reaches the rest angle when fully open (t = 0, i = 0 → no breathing)", () => {
    expect(pageAngle(restAngle(10), 1, 0, 0, 0)).toBeCloseTo(restAngle(10));
  });
  it("folds 30 % toward closed at full hero scroll", () => {
    const rest = restAngle(30);
    expect(pageAngle(rest, 1, 1, 0, 0)).toBeCloseTo(rest + (CLOSED_ANGLE - rest) * 0.3);
  });
  it("breathes by at most BREATH radians", () => {
    const rest = restAngle(30);
    for (let t = 0; t < 10; t += 0.37) {
      expect(Math.abs(pageAngle(rest, 1, 0, t, 30) - rest)).toBeLessThanOrEqual(BREATH + 1e-9);
    }
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `components/hero/tier.ts`**

```ts
export type HeroTier = "poster" | "full" | "lite";

export type TierEnv = {
  reducedMotion: boolean;
  webgl: boolean;
  deviceMemory?: number;
  saveData?: boolean;
  finePointer: boolean;
  width: number;
};

/** Spec §6 tiers (memory threshold per plan "Resolved spec conflicts" #3). */
export function decideHeroTier(env: TierEnv): HeroTier {
  const lowEnd = env.saveData === true || (env.deviceMemory !== undefined && env.deviceMemory <= 2);
  if (env.reducedMotion || !env.webgl || lowEnd) return "poster";
  return env.finePointer && env.width >= 1024 ? "full" : "lite";
}

/** Browser-only: reads the environment for decideHeroTier. */
export function readTierEnv(): TierEnv {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webgl = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl,
    deviceMemory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    finePointer: window.matchMedia("(pointer: fine)").matches,
    width: window.innerWidth,
  };
}
```

- [ ] **Step 4: Create `components/hero/ledger-math.ts`**

```ts
export const PAGE_COUNT = 46;
export const CLOSED_ANGLE = 0.06;
export const OPEN_ANGLE = Math.PI - 0.06;
export const FOLD_ON_SCROLL = 0.3;
export const BREATH = 0.012;

/** Rest angle (radians around the spine) of page i: clustered toward the covers, fanned in the middle. */
export function restAngle(i: number, count = PAGE_COUNT): number {
  const t = i / (count - 1);
  const eased = 0.5 - Math.cos(t * Math.PI) / 2;
  return CLOSED_ANGLE + (OPEN_ANGLE - CLOSED_ANGLE) * (eased * 0.55 + t * 0.45);
}

/** Page angle for intro progress `open` (0 → 1), hero scroll progress `scroll` (0 → 1) and time `t` in seconds. */
export function pageAngle(rest: number, open: number, scroll: number, t: number, i: number): number {
  const opened = CLOSED_ANGLE + (rest - CLOSED_ANGLE) * open;
  const folded = opened + (CLOSED_ANGLE - opened) * FOLD_ON_SCROLL * scroll;
  return folded + Math.sin(t * 0.6 + i * 0.41) * BREATH * open;
}
```

- [ ] **Step 5: Run the unit tests and confirm they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Write the failing E2E test** — `tests/e2e/hero.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test("live 3D hero picks its tier, renders and fades in", async ({ page }, testInfo) => {
  await page.goto("/");
  const hero = page.locator("[data-hero]");
  await expect(hero).toHaveAttribute("data-tier", testInfo.project.name === "desktop" ? "full" : "lite");
  await expect(hero).toHaveAttribute("data-hero-ready", "true", { timeout: 30_000 });
  await expect(page.locator("[data-hero] > .hero-canvas canvas")).toHaveCount(1);
});

test("reduced motion uses the poster tier and never mounts a canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-tier", "poster");
  await page.waitForTimeout(1500);
  await expect(page.locator(".hero-canvas")).toHaveCount(0);
});
```
Run: `npx playwright test tests/e2e/hero.spec.ts` — Expected: FAIL (no `data-tier`).

- [ ] **Step 7: Create `components/hero/LedgerScene.tsx`**

```tsx
"use client";

import { ContactShadows } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PAGE_COUNT, pageAngle, restAngle } from "./ledger-math";

export type SceneDrivers = {
  open: { v: number }[]; // per-page intro progress 0 → 1
  light: { v: number }; // key light 0 → 1
  scroll: { v: number }; // hero scroll progress 0 → 1
  pointer: { x: number }; // −0.5 … 0.5
};

type Props = { tier: "full" | "lite"; drivers: SceneDrivers; frozen: boolean; onFirstFrame: () => void };

const PAGE = { w: 3.1, t: 0.016, d: 4.2 };
const COVER_ANGLES = [0.012, Math.PI - 0.012];
const LANDSCAPE = { fov: 30, y: 2.9, z: 12, lookY: 3.3 };
const PORTRAIT = { fov: 40, y: 3.4, z: 19, lookY: 4.6 };

export function LedgerScene({ tier, drivers, frozen, onFirstFrame }: Props) {
  const pages = useRef<THREE.InstancedMesh>(null);
  const book = useRef<THREE.Group>(null);
  const key = useRef<THREE.SpotLight>(null);
  const frames = useRef(0);
  const framing = useRef(LANDSCAPE);
  const { camera, size } = useThree();

  const rest = useMemo(() => Array.from({ length: PAGE_COUNT }, (_, i) => restAngle(i)), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pageGeometry = useMemo(() => new THREE.BoxGeometry(PAGE.w, PAGE.t, PAGE.d).translate(PAGE.w / 2, 0, 0), []);
  const coverGeometry = useMemo(
    () => new THREE.BoxGeometry(PAGE.w + 0.14, 0.06, PAGE.d + 0.18).translate((PAGE.w + 0.14) / 2, 0, 0),
    [],
  );
  const pageMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E8E1D4", roughness: 0.9 }), []);
  const coverMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1D1B19", roughness: 0.55, metalness: 0.15 }), []);

  useEffect(
    () => () => {
      pageGeometry.dispose();
      coverGeometry.dispose();
      pageMaterial.dispose();
      coverMaterial.dispose();
    },
    [pageGeometry, coverGeometry, pageMaterial, coverMaterial],
  );

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    framing.current = size.width < size.height ? PORTRAIT : LANDSCAPE;
    cam.fov = framing.current.fov;
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useEffect(() => {
    key.current?.target.position.set(0, 1.2, 0);
    key.current?.target.updateMatrixWorld();
  }, []);

  useFrame((state) => {
    const mesh = pages.current;
    const group = book.current;
    if (!mesh || !group) return;
    const t = frozen ? 0 : state.clock.elapsedTime;
    const s = drivers.scroll.v;
    for (let i = 0; i < PAGE_COUNT; i++) {
      dummy.position.set(0, 0.07, 0);
      dummy.rotation.set(0, 0, pageAngle(rest[i], drivers.open[i].v, s, t, i));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    const parallax = tier === "full" && !frozen ? drivers.pointer.x * 0.08 : 0;
    group.rotation.y = -0.5 - 0.3 * s + (frozen ? 0 : Math.sin(t * 0.18) * 0.04) + parallax;
    const f = framing.current;
    camera.position.set(0, f.y, f.z - 1.5 * s);
    camera.lookAt(0, f.lookY, 0);
    if (key.current) key.current.intensity = 260 * drivers.light.v;
    if (frames.current < 2 && ++frames.current === 2) onFirstFrame();
  });

  return (
    <>
      <color attach="background" args={["#0B0B0C"]} />
      <fog attach="fog" args={["#0B0B0C", 12, 28]} />
      <ambientLight intensity={0.05} />
      <spotLight ref={key} position={[1.2, 10, 3.5]} color="#FFE3C0" intensity={0} distance={40} angle={0.5} penumbra={0.85} decay={2} />
      <directionalLight position={[-3, 5, -10]} color="#FFC98A" intensity={1.8} />
      <directionalLight position={[-8, 2, 7]} color="#A9B8FF" intensity={0.18} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#121113" roughness={0.6} metalness={0.1} />
      </mesh>
      <group ref={book} rotation-y={-0.5} scale={0.9}>
        <instancedMesh ref={pages} args={[pageGeometry, pageMaterial, PAGE_COUNT]} frustumCulled={false} />
        {COVER_ANGLES.map((rz) => (
          <mesh key={rz} geometry={coverGeometry} material={coverMaterial} rotation-z={rz} position-y={0.035} />
        ))}
      </group>
      {tier === "full" && <ContactShadows position={[0, 0.002, 0]} opacity={0.55} scale={14} blur={2.4} far={4} resolution={512} />}
    </>
  );
}
```

- [ ] **Step 8: Create `components/hero/HeroCanvas.tsx`**

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { dur, stagger } from "@/lib/motion";
import { PAGE_COUNT } from "./ledger-math";
import { LedgerScene, type SceneDrivers } from "./LedgerScene";

type Props = { tier: "full" | "lite"; capture: boolean };

export default function HeroCanvas({ tier, capture }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const drivers = useMemo<SceneDrivers>(
    () => ({
      open: Array.from({ length: PAGE_COUNT }, () => ({ v: capture ? 1 : 0 })),
      light: { v: capture ? 1 : 0 },
      scroll: { v: 0 },
      pointer: { x: 0 },
    }),
    [capture],
  );

  // Stop rendering while the hero is off-screen (spec §6).
  useEffect(() => {
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  // Pointer parallax — full tier only.
  useEffect(() => {
    if (tier !== "full" || capture) return;
    const onMove = (e: PointerEvent) => {
      drivers.pointer.x = e.clientX / window.innerWidth - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [tier, capture, drivers]);

  const { contextSafe } = useGSAP(
    () => {
      if (capture) return;
      // M2 (3D) — pages fold and the camera dollies in as the hero scrolls out.
      ScrollTrigger.create({
        trigger: "[data-hero]",
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          drivers.scroll.v = self.progress;
        },
      });
    },
    { scope: wrap, dependencies: [drivers, capture] },
  );

  const onFirstFrame = contextSafe(() => {
    document.querySelector("[data-hero]")?.setAttribute("data-hero-ready", "true");
    if (capture) return;
    // M1 (3D) — the book opens page by page while the key light warms up.
    gsap.to(drivers.open, { v: 1, duration: dur.bookOpen, ease: "expo.out", stagger: stagger.pages });
    gsap.to(drivers.light, { v: 1, duration: dur.light, ease: "power2.out" });
  });

  return (
    <div ref={wrap} aria-hidden className="hero-canvas absolute inset-0 -z-10">
      <Canvas
        dpr={capture ? 2 : tier === "full" ? [1, 1.5] : 1}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: tier === "full" || capture, powerPreference: "high-performance", preserveDrawingBuffer: capture }}
        camera={{ fov: 30, near: 0.1, far: 100, position: [0, 2.9, 12] }}
      >
        <LedgerScene tier={tier} drivers={drivers} frozen={capture} onFirstFrame={onFirstFrame} />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 9: Create `components/hero/HeroStage.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { decideHeroTier, readTierEnv, type HeroTier } from "./tier";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

type Stage = { tier: HeroTier; capture: boolean };

export function HeroStage() {
  const [stage, setStage] = useState<Stage | null>(null);

  useEffect(() => {
    const capture = new URLSearchParams(window.location.search).has("capture");
    if (capture) document.documentElement.classList.add("capture");
    const tier: HeroTier = capture ? "full" : decideHeroTier(readTierEnv());
    document.querySelector("[data-hero]")?.setAttribute("data-tier", tier);
    const mount = () => setStage({ tier, capture });
    // Mount after first paint so the 3D chunk never competes with the headline (LCP).
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(mount, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(mount, 200);
    return () => window.clearTimeout(id);
  }, []);

  if (!stage || stage.tier === "poster") return null;
  return <HeroCanvas tier={stage.tier} capture={stage.capture} />;
}
```

- [ ] **Step 10: Mount the stage in `components/sections/Hero.tsx`**

Add `import { HeroStage } from "@/components/hero/HeroStage";` and render `<HeroStage />` directly after `<div aria-hidden className="hero-backdrop absolute inset-0 -z-30" />`.

- [ ] **Step 11: Append canvas and capture styles to `app/globals.css`**

```css
@layer components {
  .hero-canvas { opacity: 0; transition: opacity 400ms var(--ease-out); }
  [data-hero-ready="true"] > .hero-canvas { opacity: 1; }
  /* ?capture=1 — only the 3D scene is visible (used by scripts/render-poster.mjs) */
  .capture [data-hero] > :not(.hero-canvas):not(.hero-backdrop),
  .capture [data-site-header] { opacity: 0 !important; }
}
```

- [ ] **Step 12: Run all tests**

Run: `npm test && npx playwright test`
Expected: all PASS. If `data-hero-ready` never appears on CI-like machines, confirm Edge launches with `--use-angle=swiftshader --enable-unsafe-swiftshader` (playwright.config.ts).

- [ ] **Step 13: Visual check**

Run `npm run build && npm run start -- -p 3100` in one terminal, then in another:
```bash
cd "/c/Users/satys/Desktop/auditor website" && node -e "
const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [n, w, h, m] of [['desktop', 1440, 900, false], ['mobile', 390, 844, true]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m });
    await p.goto('http://localhost:3100/'); await p.waitForSelector('[data-hero-ready=\"true\"]'); await p.waitForTimeout(2500);
    await p.screenshot({ path: 'test-results/hero-' + n + '.png' });
  }
  await b.close();
})();"
```
`Read` both PNGs. Acceptance: the fan is fully inside the frame at 390 px (no left crop), the headline stays readable above the fan, golden page edges visible. Tune only `PORTRAIT` / `LANDSCAPE` framing or `scale` if not.

- [ ] **Step 14: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add open-ledger 3D hero with quality tiers, intro and scroll fold

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 11: Poster pipeline, poster tier and Open Graph image

**Files:**
- Create: `scripts/render-poster.mjs`, `components/hero/HeroPoster.tsx`, `app/opengraph-image.alt.txt`; generated: `public/hero/ledger-poster.{avif,webp}`, `public/hero/ledger-poster-portrait.{avif,webp}`, `app/opengraph-image.png`
- Modify: `components/hero/HeroStage.tsx` (replace), `components/sections/Hero.tsx` (render `<HeroPoster />` right after `.hero-backdrop`), `package.json` (script), `app/globals.css` (append), `content/PLACEHOLDERS.md` (add the OG alt text row)
- Test: `tests/e2e/poster.spec.ts`

**Interfaces:**
- Consumes: capture mode and `data-hero-ready` from Task 10; `decideHeroTier`, `readTierEnv`.
- Produces: `<HeroPoster force? />`; npm script `poster` (`next build && node scripts/render-poster.mjs`).

**Skills:** `threejs-performance` (poster as the low-end fallback), `mobile-native`.

- [ ] **Step 1: Write the failing E2E test** — `tests/e2e/poster.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test("poster and Open Graph assets are served", async ({ request }) => {
  for (const file of ["ledger-poster.avif", "ledger-poster.webp", "ledger-poster-portrait.avif", "ledger-poster-portrait.webp"]) {
    expect((await request.get(`/hero/${file}`)).status(), file).toBe(200);
  }
  expect((await request.get("/opengraph-image.png")).status()).toBe(200);
});

test("reduced motion shows the poster image", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const src = await page.locator(".hero-poster img").first().evaluate((img) => (img as HTMLImageElement).currentSrc);
  expect(src).toMatch(/\/hero\/ledger-poster(-portrait)?\.(avif|webp)$/);
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
```
Run: `npx playwright test tests/e2e/poster.spec.ts` — Expected: FAIL (404s, no `.hero-poster`).

- [ ] **Step 2: Create `scripts/render-poster.mjs`**

```js
// Renders the hero poster (landscape + portrait) and app/opengraph-image.png from the live scene.
// Run with: npm run poster   (builds first, then starts its own server on :3100)
import { execSync, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const BASE = "http://localhost:3100";
const SHOTS = [
  { name: "ledger-poster", viewport: { width: 1440, height: 900 }, width: 1920 },
  { name: "ledger-poster-portrait", viewport: { width: 540, height: 960 }, width: 1080 },
];

async function waitForServer(url, ms = 90_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server at ${url} did not start`);
}

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3100"], { stdio: "ignore" });
const stopServer = () => {
  try {
    if (process.platform === "win32") execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: "ignore" });
    else server.kill("SIGTERM");
  } catch {}
};

let browser;
try {
  await waitForServer(BASE);
  browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  await mkdir("public/hero", { recursive: true });
  for (const shot of SHOTS) {
    const page = await browser.newPage({ viewport: shot.viewport, deviceScaleFactor: 2 });
    await page.goto(`${BASE}/?capture=1`);
    await page.waitForSelector('[data-hero-ready="true"]', { timeout: 60_000 });
    await page.waitForTimeout(1000);
    const png = await page.locator("[data-hero] > .hero-canvas").screenshot();
    const image = sharp(png).resize({ width: shot.width });
    await image.clone().avif({ quality: 50 }).toFile(`public/hero/${shot.name}.avif`);
    await image.clone().webp({ quality: 72 }).toFile(`public/hero/${shot.name}.webp`);
    if (shot.name === "ledger-poster") {
      await sharp(png).resize(1200, 630, { fit: "cover", position: "centre" }).png().toFile("app/opengraph-image.png");
    }
    await page.close();
    console.log(`rendered ${shot.name}`);
  }
} finally {
  await browser?.close();
  stopServer();
}
```
```bash
cd "/c/Users/satys/Desktop/auditor website" && npm pkg set scripts.poster="next build && node scripts/render-poster.mjs"
```

- [ ] **Step 3: Create `components/hero/HeroPoster.tsx`**

```tsx
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Art-directed static hero. Server-rendered copy: only reduced-motion visitors download an image
 * (everyone else gets a transparent pixel, so live-3D visitors pay nothing). `force` is used by the
 * client for the low-end "poster" tier.
 */
export function HeroPoster({ force = false }: { force?: boolean }) {
  const media = (extra?: string) => [force ? undefined : REDUCED, extra].filter(Boolean).join(" and ") || undefined;
  return (
    <picture className={`hero-poster absolute inset-0 -z-20${force ? " hero-poster-forced" : ""}`}>
      <source media={media("(orientation: portrait)")} srcSet="/hero/ledger-poster-portrait.avif" type="image/avif" />
      <source media={media("(orientation: portrait)")} srcSet="/hero/ledger-poster-portrait.webp" type="image/webp" />
      <source media={media()} srcSet="/hero/ledger-poster.avif" type="image/avif" />
      <source media={media()} srcSet="/hero/ledger-poster.webp" type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element -- art-directed <picture> poster */}
      <img src={force ? "/hero/ledger-poster.webp" : TRANSPARENT_PIXEL} alt="" decoding="async" className="size-full object-cover" />
    </picture>
  );
}
```

- [ ] **Step 4: Replace `components/hero/HeroStage.tsx`** (poster tier now renders a forced poster unless the visitor prefers reduced motion — they already see the server-rendered one)

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroPoster } from "./HeroPoster";
import { decideHeroTier, readTierEnv, type HeroTier } from "./tier";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

type Stage = { tier: HeroTier; capture: boolean; forcePoster: boolean };

export function HeroStage() {
  const [stage, setStage] = useState<Stage | null>(null);

  useEffect(() => {
    const capture = new URLSearchParams(window.location.search).has("capture");
    if (capture) document.documentElement.classList.add("capture");
    const env = readTierEnv();
    const tier: HeroTier = capture ? "full" : decideHeroTier(env);
    document.querySelector("[data-hero]")?.setAttribute("data-tier", tier);
    const mount = () => setStage({ tier, capture, forcePoster: tier === "poster" && !env.reducedMotion });
    // Mount after first paint so the 3D chunk never competes with the headline (LCP).
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(mount, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(mount, 200);
    return () => window.clearTimeout(id);
  }, []);

  if (!stage) return null;
  if (stage.tier === "poster") return stage.forcePoster ? <HeroPoster force /> : null;
  return <HeroCanvas tier={stage.tier} capture={stage.capture} />;
}
```

- [ ] **Step 5: Render the poster and add styles**

In `components/sections/Hero.tsx`: `import { HeroPoster } from "@/components/hero/HeroPoster";` and render `<HeroPoster />` right after the `.hero-backdrop` div (before `<HeroStage />`).

Append to `app/globals.css`:
```css
@layer components {
  .hero-poster-forced { animation: poster-in 400ms var(--ease-out) both; }
  @keyframes poster-in { from { opacity: 0; } }
}
```

`app/opengraph-image.alt.txt`:
```text
Firm Name & Co. — an open ledger whose pages fan into a sunburst under warm light.
```
Add a row to `content/PLACEHOLDERS.md`: `| app/opengraph-image.alt.txt | Firm Name & Co. … |`.

- [ ] **Step 6: Generate the assets and inspect them**

Run: `npm run poster`
Expected: `rendered ledger-poster`, `rendered ledger-poster-portrait`; files in `public/hero/` (each AVIF ≲ 150 KB) and `app/opengraph-image.png`.
`Read` `public/hero/ledger-poster.webp` and `public/hero/ledger-poster-portrait.webp`. Acceptance: whole fan visible, no UI text, golden edges, dark stage. If the portrait crops the fan, adjust `PORTRAIT` in `LedgerScene.tsx` and re-run.

- [ ] **Step 7: Run all tests**

Run: `npm test && npx playwright test`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
feat: add rendered hero poster tier and Open Graph image

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

### Task 12: Verification, performance and design review

**Files:**
- Create: `scripts/with-server.mjs`, `tests/e2e/visual.spec.ts`, `docs/superpowers/reports/2026-10-31-v1-verification.md`
- Modify: whatever the reviews below require (stay inside the spec; spacing scale and motion inventory are fixed)

**Interfaces:**
- Produces: `node scripts/with-server.mjs "<command>"` (starts `next start -p 3100` on an existing build, runs the command, stops the server); opt-in specs `VISUAL=1` (screenshots) and `PERF=1` (long-task check).

**Skills:** `baseline-ui`, `review-animations`, `animation-performance`, `break-ui`, `impeccable`, `mobile-native`.

- [ ] **Step 1: Create `scripts/with-server.mjs`**

```js
// Usage: node scripts/with-server.mjs "<command>"   (run `npm run build` first)
import { execSync, spawn } from "node:child_process";

const command = process.argv[2];
if (!command) {
  console.error('usage: node scripts/with-server.mjs "<command>"');
  process.exit(1);
}

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3100"], { stdio: "ignore" });
const stop = () => {
  try {
    if (process.platform === "win32") execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: "ignore" });
    else server.kill("SIGTERM");
  } catch {}
};

let code = 1;
try {
  const end = Date.now() + 90_000;
  for (;;) {
    try {
      if ((await fetch("http://localhost:3100")).ok) break;
    } catch {}
    if (Date.now() > end) throw new Error("server did not start");
    await new Promise((r) => setTimeout(r, 500));
  }
  execSync(command, { stdio: "inherit" });
  code = 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  stop();
}
process.exit(code);
```
Never stop servers with `taskkill /IM node.exe` — that would also kill the agent's own Node process.

- [ ] **Step 2: Create `tests/e2e/visual.spec.ts`** (opt-in review captures + long-task check)

```ts
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
});

test("no long tasks while scrolling at 4× CPU throttle", async ({ page }, info) => {
  test.skip(!process.env.PERF || info.project.name !== "desktop", "set PERF=1 (desktop project)");
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
  console.log("long tasks (ms):", longTasks);
  expect(longTasks.filter((d) => d > 50)).toEqual([]);
});
```

- [ ] **Step 3: Run every gate**

```bash
cd "/c/Users/satys/Desktop/auditor website" && npm test && npm run lint && npm run typecheck && npx playwright test
```
Expected: all PASS. Fix failures before continuing.

- [ ] **Step 4: Capture and review screenshots**

```bash
cd "/c/Users/satys/Desktop/auditor website" && VISUAL=1 npx playwright test tests/e2e/visual.spec.ts
```
`Read` every PNG in `test-results/shots/`. Check against the spec and `docs/design/mockup/`: section rhythm (128 / 96 / 64), gutters (64 / 48 / 24), equal service-row heights, hairline alignment, headline never overlapping the fan, nothing overflowing at 390 px, footer wordmark fitting.

- [ ] **Step 5: Long-task check**

```bash
cd "/c/Users/satys/Desktop/auditor website" && PERF=1 npx playwright test tests/e2e/visual.spec.ts --project=desktop
```
Expected: PASS. If long tasks appear only while the 3D scene renders under SwiftShader (software WebGL), re-run once without the SwiftShader launch args to separate CPU-rendering cost from real main-thread work, and note it in the report.

- [ ] **Step 6: Lighthouse (mobile)**

```bash
cd "/c/Users/satys/Desktop/auditor website" && npm run build && \
CHROME_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" node scripts/with-server.mjs \
"npx --yes lighthouse@latest http://localhost:3100 --quiet --chrome-flags=--headless=new --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=test-results/lighthouse-mobile.json" && \
node -e "const r=require('./test-results/lighthouse-mobile.json');for(const [k,v] of Object.entries(r.categories))console.log(k,Math.round(v.score*100));for(const id of ['largest-contentful-paint','cumulative-layout-shift','total-blocking-time'])console.log(id,r.audits[id].displayValue)"
```
Budgets (spec G5): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.05, TBT ≤ 200 ms. If Performance misses, the allowed levers are: longer idle delay before mounting the canvas, mounting the lite tier on first scroll/pointer interaction, lowering lite-tier DPR or page count, trimming font axes/weights. Do not remove motion from the inventory.

- [ ] **Step 7: Skill reviews** (read each SKILL.md first; fix findings that are inside the spec)

1. `baseline-ui` on `components/**/*.tsx` — spacing, hierarchy, typography and layout only. Its stack/animation rules do not apply (see `docs/skills.md`).
2. `review-animations` and `animation-performance` on `components/motion/*`, `components/layout/Header.tsx`, `components/layout/MenuOverlay.tsx`, `components/hero/HeroCanvas.tsx`, `components/hero/LedgerScene.tsx` and the motion rules in `app/globals.css`.
3. `break-ui` checklist — temporarily set a 40-character firm name, 30-character partner names and a long email in `content/site.ts`, re-run Step 4, fix wrapping/overflow, then **revert the content**.
4. `impeccable` — from PowerShell at the repo root run `& ".\.claude\skills\impeccable\scripts\impeccable.cmd" context` (first run downloads the checksum-verified engine; approved by the owner), then follow `reference/audit.md` and `reference/polish.md` for the home page. Never run `init` or `hooks on`.

- [ ] **Step 8: Re-run every gate** (Step 3) and the long-task check (Step 5).

- [ ] **Step 9: Write `docs/superpowers/reports/2026-10-31-v1-verification.md`**

Include: commands run and pass/fail counts, Lighthouse scores and the three metrics, long-task results, each review's findings with the fix (or the reason it was out of scope), screenshots list, and follow-ups for the owner (real content, ICAI wording, domain/hosting).

- [ ] **Step 10: Commit**

```bash
cd "/c/Users/satys/Desktop/auditor website" && git add -A && git commit -q -F - <<'EOF'
chore: verification pass — review fixes, performance check and report

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WQWPbZm8ea8nR2Ry272xdR
EOF
```

---

## Spec coverage map

| Spec | Tasks |
|---|---|
| §3 scope, §4 IA & content | 2, 4, 5, 6 |
| §5 tokens, type, spacing, components | 3, 4, 5, 6 |
| §6 3D hero, tiers, poster, off-screen pause | 10, 11 |
| §7.3 Lenis | 7 |
| §7.4 M1 · M2 | 8 (text) · 10 (3D) |
| §7.4 M3 · M4 · M5 · M6 · M14 | 8 |
| §7.4 M7 · M8 · M9 · M11 · M12 | 9 (M9 reveal in 8) |
| §7.4 M10 | 5 (copy email) · 8 (heading) · 9 (magnetic) |
| §7.4 M13 | 5 |
| §7.5 FOUC strategy | 7, 8 |
| §7.6 jank rules | 3, 4, 7, 9, 10, 12 |
| §9 accessibility | 3, 6, 8, 9, 12 |
| §10 SEO | 5, 11 |
| §11 ICAI | 2 |
| §12 testing & reviews | every task, 12 |
