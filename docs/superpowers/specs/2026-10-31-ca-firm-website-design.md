# CA Firm Website — Design Spec (v1)

- **Date:** 2026-10-31
- **Status:** Draft — awaiting owner review
- **Branch:** `feat/site-v1`
- **Visual reference (approved):** `docs/design/mockup/` — `cred-hero.html`, `mock-1-desktop-hero.jpg`, `mock-2-desktop-full-page.jpg`, `mock-3-mobile.jpg`

---

## 1. Summary

A single-page marketing website for an Indian Chartered Accountancy firm (placeholder name
**"Firm Name & Co."**) plus a `/disclaimer` page.

**Direction: dark premium, inspired by cred.club** — a dark stage, a large high-contrast serif
headline, a sculptural 3D object, bordered corner UI. *Inspired, not copied:* the 3D concept
(an open ledger whose pages fan into a sunburst), the wordmark, type, palette and copy are our own.

**Motion is a first-class requirement:** smooth inertial scrolling, scroll-linked animation in
every section, restrained micro-interactions — and no jank on mid-range phones.

## 2. Goals & success criteria

| # | Goal | Measured by |
|---|---|---|
| G1 | Premium, calm, trustworthy; reads as a serious practice | Owner review against the approved mockup |
| G2 | Fluid motion everywhere, no jerks | 60 fps desktop; no long task > 50 ms while scrolling (trace spot-check, 4× CPU throttle) |
| G3 | Senior-level spacing craft | Every spacing value from the scale (§5.3); review passes |
| G4 | ICAI-safe content | Checklist §11 + `content/guard.ts` unit test |
| G5 | Fast | Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95; LCP ≤ 2.5 s, CLS ≤ 0.05, TBT ≤ 200 ms |
| G6 | Accessible | WCAG 2.2 AA; full content with `prefers-reduced-motion: reduce` and keyboard only |
| G7 | Easy to edit | All firm content in one typed file (`content/site.ts`) |

## 3. Scope

**In v1**
- `/` — Header, Hero (3D), Facts, Practice, Services, Process ("How we work"), Partners, Contact, Footer.
- `/disclaimer` — full disclaimer text.
- Full-screen menu overlay.
- Placeholder content in `content/site.ts`, listed in `content/PLACEHOLDERS.md`.
- SEO: metadata, static Open Graph image, JSON-LD (`AccountingService`), `robots.txt`, `sitemap.xml`.

**Not in v1 (YAGNI):** contact form, blog/insights, CMS, Telugu/Hindi versions, analytics,
cookie banner (no cookies are set), custom cursor, route-transition animations, deployment
(the build is Vercel-ready but not deployed).

## 4. Information architecture & content model

Anchor ids: `#top` (hero), `#practice`, `#services`, `#process`, `#partners`, `#contact`.
Menu links: Practice, Services, How we work, Partners, Contact, Disclaimer (`/disclaimer`).

`content/site.ts` (typed `as const`; every value below is a placeholder):

```ts
export const site = {
  firm: { name: "Firm Name & Co.", monogram: "F&C", designation: "Chartered Accountants",
          frn: "000000S", established: 1998, city: "Hyderabad" },
  hero: { eyebrow: "Audit · Tax · Advisory", headline: ["Clarity,", "line by line."],
          sub: "Audit, taxation and advisory for owner-led businesses, families and institutions, from our office in Hyderabad." },
  facts: [ { value: "1998", label: "Established" }, { value: "4", label: "Partners" },
           { value: "2", label: "Offices" }, { value: "000000S", label: "ICAI firm registration" } ],
  practice: { label: "The practice",
              statement: "We read every line, so the people who depend on your numbers",
              emphasis: "can read them plainly." },
  services: [
    { n: "01", title: "Audit & Assurance",  summary: "Statutory, internal and tax audits." },
    { n: "02", title: "Direct Tax",         summary: "Returns, assessments, representation and planning." },
    { n: "03", title: "GST",                summary: "Registration, returns, reconciliations and proceedings." },
    { n: "04", title: "Company Law & ROC",  summary: "Incorporation, annual filings and secretarial compliance." },
    { n: "05", title: "Advisory",           summary: "Structuring, valuations and transaction support." },
  ],
  process: [
    { n: "01", title: "Understand", body: "We learn the business, its records and its obligations before we test anything." },
    { n: "02", title: "Examine",    body: "Fieldwork and testing, line by line, with questions raised as they arise." },
    { n: "03", title: "Report",     body: "Findings, opinions and filings, written plainly and delivered on time." },
    { n: "04", title: "Advise",     body: "What the numbers mean for the next decision, and how to act on it." },
  ],
  partners: [
    { name: "Partner Name", credential: "FCA", focus: "Audit & Assurance" },
    { name: "Partner Name", credential: "FCA", focus: "Direct Tax" },
    { name: "Partner Name", credential: "ACA", focus: "GST" },
    { name: "Partner Name", credential: "ACA", focus: "Advisory" },
  ],
  contact: { phone: "+91 00000 00000", email: "office@firmname.in",
             address: ["Address line 1", "Hyderabad 500 000", "Telangana, India"],
             hours: "Mon–Sat, 10:00–18:30", mapUrl: "https://maps.google.com/?q=Hyderabad" },
  disclaimer: {
    short: "This website provides information about the firm and its services. It is not an advertisement or a solicitation of work.",
    full: [ // DRAFT — owner must verify against ICAI's current Code of Ethics
      "The information on this website is provided for general information about Firm Name & Co. and the services it offers. It does not constitute professional advice, an advertisement, or a solicitation of work.",
      "No reader should act on the basis of any material on this website without seeking specific professional advice. The firm accepts no liability for any loss arising from reliance on this information.",
      "Links to external websites are provided for convenience; the firm is not responsible for their content.",
    ],
  },
} as const;
```

`content/guard.ts` exports a check used by a unit test: no banned words (`best`, `leading`,
`no. 1`, `number one`, `top`, `free`, `guaranteed`, `cheapest`, `most trusted`), no prices
(`₹` or `Rs` followed by digits), no testimonial/client/review fields.

## 5. Visual design system

### 5.1 Color (dark only)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0B0B0C` | page background |
| `--color-surface` | `#121214` | menu overlay, header after scroll |
| `--color-ink` | `#F1ECE4` | primary text |
| `--color-muted` | `#9C978E` | secondary text (≈ 6.7:1 on bg) |
| `--color-line` | `rgb(241 236 228 / 0.16)` | hairlines, borders |
| `--color-brass` | `#C9A96E` | italic emphasis, focus ring, active states — never body text |

Every text/background pair must pass AA (4.5:1 body, 3:1 large text).

### 5.2 Type

- **Serif (display):** Fraunces variable (opsz 9–144, wght 300–700, italic) — headings, statement, fact values.
- **Sans (body/UI):** Manrope 400 / 500 / 600.
- **Mono (labels):** IBM Plex Mono 400 / 500 — eyebrows, indices, labels; uppercase, tracking 0.12em.
- Loaded with `next/font/google` (self-hosted, `display: swap`, metric-adjusted fallbacks → no CLS).

| Role | Desktop / mobile | Line height | Notes |
|---|---|---|---|
| h1 (hero) | 104 / 54 px | 0.94 | tracking −0.025em, opsz 144, wght 600 |
| Statement | 52 / 32 px | 1.12 | tracking −0.02em, wght 400, max 22ch |
| h2 (section) | 64 / 40 px | 1.0 | tracking −0.02em |
| h3 (service title) | 36 / 26 px | 1.1 | tracking −0.015em, wght 500 |
| Fact value | 44 / 36 px | 1.0 | lining + tabular numerals |
| Body | 17 / 16 px | 1.6 | max 65ch |
| Small | 15 px | 1.5 | |
| Mono label | 12 / 11 px | 1.4 | uppercase, tracking 0.12em |

Sizes interpolate between breakpoints with `clamp()`.

### 5.3 Spacing & layout

- **Spacing scale (4 px base) — the only allowed values:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
  (Tailwind `1, 2, 3, 4, 6, 8, 12, 16, 24, 32`). Arbitrary values such as `p-[13px]` fail review.
- **Container:** content max-width 1312 px; gutter 64 px (≥ 1024), 40 px (≥ 640), 24 px (< 640).
- **Grid:** 12 columns, 24 px gap.
- **Section rhythm (padding-block):** 128 desktop / 96 tablet / 64 mobile.
- **Proximity:** related items 8–16 apart; groups 32–48; sections 128.
- **Surfaces:** 1 px hairlines separate content; no drop shadows on UI; square corners (radius 0).

### 5.4 Components (visual)

- **Header** — over the hero (absolute), fixed after scrolling. Left: 48 px monogram box + firm name (serif 20) + designation (mono 10). Right: bordered box (FRN / Est.) + 64 px burger cell. Mobile: monogram + name + 48 px burger.
- **Hero corner contact box** (bottom-right) — bordered, translucent bg + 8 px blur, title 15/600 + mono phone, 40 px square arrow. Mobile: full-width bottom bar.
- **Facts** — 4 columns with vertical hairlines; mobile 2 × 2.
- **Practice** — mono label + statement (serif), brass italic emphasis.
- **Services** — rows: index (96 px) | title | summary | arrow (40 px); equal row heights; hairlines top/bottom. Mobile: index + title row, summary below.
- **Process** — 4 steps with a progress hairline; desktop pinned, mobile stacked.
- **Partners** — 4 cards: initials monogram tile (no photos in v1), name (serif), credential (mono), focus (muted).
- **Contact** — large serif heading; three columns (Visit / Call & write / Hours); copy-email button; map link.
- **Footer** — short disclaimer, links (Disclaimer, Contact), © year, large wordmark.

## 6. 3D hero — "open ledger"

- **Concept:** an open book whose 46 pages fan around the spine into a semicircular sunburst; dark covers; warm key light from above, warm rim light from behind (golden page edges), faint cool fill; dark floor; fog. Book rotated −0.5 rad on Y, scale 0.9; slow "breathing"; pointer parallax on desktop.
- **Stack:** `three@0.187`, `@react-three/fiber@9`, `@react-three/drei@10`.
- **Geometry:** pages are one `InstancedMesh` (`BoxGeometry(3.1, 0.016, 4.2)`, translated so the pivot is the spine) → one draw call; instance matrices updated per frame (46).
- **Materials:** paper `#E8E1D4` (standard, roughness 0.9); covers `#1D1B19` (roughness 0.55, metalness 0.15); floor `#121113`.
- **Lights:** SpotLight `#FFE3C0` at (1.2, 10, 3.5) → target (0, 1.2, 0); DirectionalLight rim `#FFC98A` at (−3, 5, −10); fill `#A9B8FF` at (−8, 2, 7); ambient 0.05. ACES Filmic tone mapping.
- **Shadows:** desktop uses drei `ContactShadows` (cheap, soft); no real-time shadow maps unless the budget allows a single 1024 spot map. Lite tier: none.
- **Camera:** landscape fov 30, position (0, 2.9, 12), look-at (0, 3.3, 0). Portrait fov 40, position (0, 3.4, 19), look-at (0, 4.6, 0). The whole fan must stay inside the frame at 390 px width (the mockup crops the left edge — fix by framing/scale).
- **Quality tiers** (decided client-side by `useHeroTier`):
  - **Poster** (checked first) — reduced motion, no WebGL, `navigator.deviceMemory ≤ 4`, or `connection.saveData`: static `public/hero/ledger-poster.avif` (+ `.webp`) rendered from the same scene by `scripts/render-poster.mjs`.
  - **Full** — `(pointer: fine)` and viewport ≥ 1024 px: live, DPR [1, 1.5], ContactShadows, pointer parallax.
  - **Lite** — every other device with WebGL (phones, tablets, small windows): live, DPR 1, no shadows, no parallax.
- **Loading:** hero text is server-rendered HTML. The poster image is always in the markup (no layout shift); the canvas mounts via `next/dynamic` (`ssr: false`) after first paint, renders its first frame, then crossfades over the poster (opacity, 400 ms).
- **Off-screen:** IntersectionObserver sets R3F `frameloop="never"` when the hero is out of view; also paused when `document.hidden`.
- **Animations:** intro "book opens" (M1) and scroll "pages fold + camera dolly" (M2). Animated values live in refs and `useFrame`; never React state per frame.

## 7. Motion system

### 7.1 Principles

1. Every animation has a purpose (hierarchy, pacing, feedback); nothing moves for decoration alone.
2. Animate only `transform` and `opacity` (`clip-path` only for masks and the menu overlay). Never width, height, top, left, margin or padding.
3. Two timing tiers: **UI micro-interactions** (≤ 300 ms, `--ease-out`) and **editorial reveals** (700–1100 ms, `expo.out`).
4. `prefers-reduced-motion: reduce` → no smooth scroll, no scrubs, no pins, no intro, poster hero; content visible immediately; hover = colour change only.
5. One clock: the GSAP ticker drives Lenis; ScrollTrigger reads native scroll.

### 7.2 Tokens (CSS `@theme` + mirrored in `lib/motion.ts`)

| Token | Value |
|---|---|
| `--ease-out` (UI) | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `--ease-in-out` (on-screen movement) | `cubic-bezier(0.77, 0, 0.175, 1)` |
| Editorial ease (GSAP) | `expo.out` |
| Scrub ease | `none` (Lenis supplies the smoothing) |
| `--dur-press` | 140 ms |
| `--dur-ui` | 200 ms |
| `--dur-overlay` | 500 ms |
| Editorial duration | 0.9 s (line reveals 1.1 s) |
| Stagger — UI / editorial | 0.04 s / 0.08 s |
| Reveal distance | 24 px (y) |

### 7.3 Smooth scroll — Lenis (not ScrollSmoother)

- `lenis@1.3`, `autoRaf: false`; `gsap.ticker.add((t) => lenis.raf(t * 1000))`; `gsap.ticker.lagSmoothing(0)`; `lenis.on("scroll", ScrollTrigger.update)`.
- Options: `lerp: 0.1`, `smoothWheel: true`, `syncTouch: false` (native momentum on touch devices).
- Anchor links scroll via `lenis.scrollTo(target, { offset })` (header height offset).
- Not created at all under reduced motion (native scroll; anchors jump natively, with `scroll-margin-top` on sections for the header).
- `lenis.stop()` while the menu overlay is open; `lenis.start()` on close.
- Exposed through a React context (`useLenis()`).
- **Why not ScrollSmoother:** it transforms a content wrapper, which breaks `position: sticky` and forces fixed elements (header, overlay) outside the tree — awkward with the App Router layout and the hero canvas. Lenis keeps native scroll semantics (anchors, find-in-page, sticky).

### 7.4 Motion inventory (exact behaviour — this list is the scope)

| # | Where | Trigger | Animation |
|---|---|---|---|
| M1 | Intro | `document.fonts.ready` | Book opens: pages fan from closed (θ ≈ 0.06) to rest angles, 0.012 s stagger per page, 1.6 s `expo.out`; light intensity 0 → 1 over 1.2 s. Headline lines mask-reveal (yPercent 110 → 0), 1.1 s `expo.out`, 0.08 s stagger, +0.15 s. Eyebrow, sub, header, corner box: opacity 0 → 1, y 12 → 0, 0.8 s, 0.06 s stagger. **Budget: headline fully visible ≤ 1.2 s after fonts are ready.** |
| M2 | Hero scroll-out | ScrollTrigger on hero, start `top top`, end `bottom top`, `scrub: true` | Pages fold 30 % toward closed; camera z 12 → 10.5; book rotation Y −0.5 → −0.8; hero copy y 0 → −80 px and opacity 1 → 0 by 60 % progress. |
| M3 | Section blocks | enter viewport — `ScrollTrigger.batch`, `once: true`, start `top 85%` | opacity 0 → 1, y 24 → 0, 0.9 s `expo.out`, 0.08 s stagger. |
| M4 | Hairlines | enter viewport | scaleX 0 → 1 from left, 1.0 s `expo.out`. |
| M5 | Fact values | enter viewport | line mask-reveal (yPercent 100 → 0), 0.9 s, 0.08 s stagger. No count-up animations. |
| M6 | Practice statement | scrub, start `top 70%`, end `bottom 60%` | words fade 0.18 → 1 opacity in reading order (SplitText words); emphasis words end in full brass. |
| M7 | Services | enter viewport + hover/focus | Rows reveal (M3) with row hairline (M4). Hover/focus (fine pointer): title x 0 → 8 px; arrow rotate −45° → 0° and x 0 → 4 px; summary colour muted → ink; row tint (pseudo-element opacity 0 → 1). 200 ms `--ease-out`. |
| M8 | Process | `gsap.matchMedia` | Desktop (≥ 1024): pin the section, scrub through 4 steps — progress hairline scaleX 0 → 1; active step opacity 1, others 0.35; step body crossfade (y 16 → 0). `anticipatePin: 1`, `end: "+=200%"`. Mobile: no pin; steps reveal with M3. |
| M9 | Partners | enter viewport + hover | Cards reveal (M3); monogram tile scale 0.96 → 1 with opacity. Hover/focus: name underline draws (scaleX 0 → 1). |
| M10 | Contact | enter viewport + click | Heading line mask-reveal (as M1); blocks M3. Copy-email: label crossfades "Copy email" → "Copied" (160 ms), reverts after 1.6 s. Primary contact button is magnetic on fine pointers (max 8 px, returns over 300 ms `--ease-out`). |
| M11 | Header | Lenis scroll direction | After 120 px: hide on scroll down (yPercent −100, 300 ms `--ease-in-out`), show on scroll up; after the hero: surface 80 % + 8 px blur. Never hides while the menu is open or focus is inside the header. |
| M12 | Menu overlay | burger click / Esc | Open: clip-path `inset(0 0 100% 0)` → `inset(0)`, 500 ms `--ease-in-out`; links y 24 → 0 + opacity, 0.04 s stagger, +0.15 s; burger → X (200 ms). Close reverses in 350 ms. Dialog semantics, focus trap, Esc closes, focus returns to the burger, `lenis.stop()`. |
| M13 | Links & buttons | hover / focus / press | Underline draws scaleX 0 → 1 from left (200 ms); buttons `:active` scale 0.97 (140 ms); arrow nudge x 4 px; focus-visible 2 px brass outline, 4 px offset (not animated). Hover styles only under `@media (hover: hover) and (pointer: fine)`. |
| M14 | Footer wordmark | enter viewport | Characters rise (SplitText chars) yPercent 100 → 0, 0.02 s stagger, 1.0 s `expo.out`. |

Anything not in this table is out of scope for v1.

### 7.5 SplitText and flash-of-unstyled-content strategy

- SSR renders real text (SEO, LCP). An inline `<head>` script adds `js` and, when motion is allowed, `motion-ok` classes to `<html>` before first paint.
- CSS: `.motion-ok [data-split] { visibility: hidden; }`. The component makes the element visible in the same frame it applies the `from` state. Without JS or with reduced motion, text is always visible.
- Split after `document.fonts.ready`, using SplitText `autoSplit: true` with `onSplit()` returning the animation (clean re-splits on resize) and `mask: "lines"`.
- Call `ScrollTrigger.refresh()` after fonts are ready, after splits, and after the hero canvas/poster mounts.

### 7.6 Jank-prevention rules (acceptance criteria)

- Transform/opacity only (clip-path only for M12 and masks).
- `ScrollTrigger.config({ ignoreMobileResize: true })`.
- Hero height `100svh`, clamped to 640–1000 px — never `100vh`.
- `anticipatePin: 1` on pins; pin only on desktop.
- No global `will-change`; only on active pins/scrubs (GSAP-managed).
- `backdrop-filter` only on the header and the hero corner box.
- No `scroll` event listeners outside Lenis/ScrollTrigger.
- 3D: instanced pages, paused off-screen, no per-frame React state.
- No main-thread task > 50 ms during scroll (trace spot-check).
- Fonts via `next/font` with metric-adjusted fallbacks.

## 8. Technical architecture

### 8.1 Stack

- **Next.js 16** (App Router, TypeScript), **React 19**, **Tailwind CSS 4** (`@theme` tokens), ESLint (Next config). TypeScript version: whatever `create-next-app@latest` pins — do not force TypeScript 7.
- **gsap 3.15** + **@gsap/react 2.1** (`useGSAP`); plugins ScrollTrigger and SplitText (all GSAP plugins are free, from the public `gsap` package). **lenis 1.3**.
- **three 0.187**, **@react-three/fiber 9**, **@react-three/drei 10**.
- **Tests:** Vitest (unit); Playwright 1.64 with `channel: "msedge"` (uses the installed Edge, no browser download); Lighthouse run manually against the production build.
- **Output:** all routes statically prerendered by `next build`. Vercel-ready; not deployed in v1.
- `.gitattributes` with `* text=auto eol=lf`.

### 8.2 Structure

```
app/
  layout.tsx            fonts, metadata, <html> class script, MotionProvider, skip link, Header, Footer
  page.tsx              sections in order (Server Component)
  disclaimer/page.tsx
  globals.css           Tailwind v4 + @theme tokens (colour, fonts, spacing, easing, durations)
  icon.svg  opengraph-image.png  robots.ts  sitemap.ts
components/
  motion/MotionProvider.tsx   Lenis + GSAP ticker + ScrollTrigger sync; reduced motion; context
  motion/useReducedMotion.ts
  motion/Reveal.tsx           batch reveals and hairlines (M3, M4) via data attributes
  motion/SplitLines.tsx       line/char mask reveals (M1, M5, M10, M14)
  motion/ScrubWords.tsx       statement word scrub (M6)
  layout/Header.tsx  layout/MenuOverlay.tsx  layout/Footer.tsx
  sections/Hero.tsx  Facts.tsx  Practice.tsx  Services.tsx  Process.tsx  Partners.tsx  Contact.tsx
  hero/HeroCanvas.tsx (client, dynamic)  hero/LedgerScene.tsx  hero/useHeroTier.ts  hero/HeroPoster.tsx
  ui/ArrowLink.tsx  ui/CopyEmail.tsx  ui/Magnetic.tsx  ui/Monogram.tsx
content/site.ts  content/guard.ts  content/PLACEHOLDERS.md
lib/gsap.ts (register plugins once, client-only)  lib/motion.ts (tokens)
scripts/render-poster.mjs   (Playwright: render the scene → public/hero/ledger-poster.{avif,webp})
tests/unit/*.test.ts  tests/e2e/*.spec.ts
```

**Boundaries:** sections are Server Components that render semantic HTML from `content/site.ts`.
Motion is attached by small client components through data attributes and refs, so every
section's content renders and reads correctly without JavaScript.

## 9. Accessibility

- Landmarks: `header`, `nav`, `main`, `footer`; one `h1`; an `h2` per section; skip link to `#main`.
- Menu is a modal dialog (`aria-modal`, focus trap, Esc, focus returns to the trigger).
- Every hover effect is mirrored on `:focus-visible`.
- Reduced motion per §7.1 (4), plus a CSS `@media (prefers-reduced-motion: reduce)` safety net.
- AA contrast everywhere; 2 px brass focus ring.
- Hero canvas is `aria-hidden` (decorative). `lang="en-IN"`. Phone and email are `tel:` / `mailto:` links.

## 10. SEO

- Metadata API — title "Firm Name & Co. · Chartered Accountants, Hyderabad"; factual description.
- JSON-LD `AccountingService` (name, address, telephone, url — placeholders).
- `robots.ts`, `sitemap.ts`; static Open Graph image derived from the hero poster + wordmark.

## 11. ICAI compliance checklist

- No fees, prices, discounts, or "free" anything.
- No testimonials, ratings, reviews, client names or client logos.
- No superlatives or comparisons ("best", "leading", "No. 1", "top", "most trusted").
- No pop-ups, banners or push prompts; contact is pull-only (link, `tel:`, `mailto:`).
- Facts are factual only (year established, partners, offices, FRN).
- Short disclaimer in the footer; full text at `/disclaimer`.
- No ICAI / "CA India" logo.
- Enforced by `content/guard.ts` + unit test. The firm must verify final copy against ICAI's current
  Code of Ethics before launch — the research behind this list used secondary sources.

## 12. Testing & verification

- **Unit (Vitest):** content guard; motion token sanity; `useHeroTier` decision table; header hide/show logic.
- **E2E (Playwright, msedge, launch args `--use-angle=swiftshader --enable-unsafe-swiftshader`):**
  - Home renders every section and anchor; no console errors.
  - Reduced motion (`page.emulateMedia({ reducedMotion: "reduce" })`): all text visible without scrolling animation; no Lenis; hero shows the poster.
  - Menu: keyboard open/close, focus trapped and restored, Esc closes.
  - No horizontal overflow at 390, 768 and 1440 px (viewport emulation).
  - Screenshots at 390 / 768 / 1440 saved for visual review.
- **Gates:** `next build` passes; `tsc --noEmit` and `eslint` clean.
- **Performance:** Lighthouse (mobile) against G5; scroll trace spot-check for long tasks.
- **Skill reviews:** `baseline-ui` (spacing/type only), `review-animations`, `animation-performance`, `break-ui` (long names/labels), then `impeccable` `audit` + `polish` (Windows: `scripts/impeccable.cmd`; never `init` or `hooks on`).

## 13. Skills map (read before coding)

| Area | SKILL.md files under `.claude/skills/` |
|---|---|
| GSAP in React | `gsap-react`, `gsap-core`, `gsap-timeline` |
| ScrollTrigger, pins, scrub | `gsap-scrolltrigger`, `gsap-performance` |
| SplitText | `gsap-plugins` (SplitText section) |
| Easing / duration | `animate`, `animation-performance` |
| R3F scene | `threejs-react-three-fiber`, `threejs-fundamentals`, `threejs-lighting`, `threejs-materials`, `threejs-geometry`, `threejs-performance` |
| Mobile feel | `mobile-native` |
| Reviews | `review-animations`, `baseline-ui`, `break-ui`, `impeccable` |

Subagents working in a git worktree must `Read` these files directly — the Skill tool listing may
not include project skills there.

## 14. Technical notes / known traps

- `create-next-app .` may refuse this directory (it already contains `.claude/`, `docs/`, `.git`): scaffold into a temp directory and move the files in.
- Do not install TypeScript 7 manually.
- `three@0.187` vs skills written for r186: compatible for this usage.
- R3F and Lenis run separate rAF callbacks — fine; never drive React state per frame.
- Hero tier is detected client-side; SSR always renders the poster markup so nothing shifts.
- Edge headless enforces a ~500 px minimum window width — use Playwright viewport emulation for 390 px checks.

## 15. Open items (owner)

- Real firm details, partner list, office address, phone/email, disclaimer wording (verify with ICAI).
- Domain and hosting (Vercel suggested) — after v1.
