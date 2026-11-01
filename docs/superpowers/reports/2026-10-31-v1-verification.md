# v1 verification: gates, performance, reviews

Date: 2026-11-01. Branch `feat/site-v1`. Task 12 of the plan `docs/superpowers/plans/2026-10-31-ca-firm-website.md`.
Spec: `docs/superpowers/specs/2026-10-31-ca-firm-website-design.md`.

Scratch tools, logs and raw Lighthouse JSON cited as `t12/…` live in `.superpowers/sdd/2026-10-31-ca-firm-website/t12/`.
That folder is git-ignored and local to the machine that ran this verification.

**Result: the gates pass, and so do the Lighthouse Accessibility, Best Practices and SEO budgets. The Performance budget
(G5) and the long-task check do not pass.** The real numbers are below, with what the misses come from and the levers
that were measured.

## 1. Commands and results

| Gate | Command | Result |
|---|---|---|
| Unit | `npm test` | 47 passed (7 files) |
| Lint | `npm run lint` | clean |
| Types | `npm run typecheck` | clean |
| E2E | `npx playwright test` (Edge, desktop + mobile projects) | **170 passed, 32 skipped** (9.6 min) |
| Visual captures | `VISUAL=1 npx playwright test tests/e2e/visual.spec.ts` | 5 passed, 3 skipped (the PERF check in both projects; the 1024 px laptop capture on mobile) |
| Long tasks | `PERF=1 npx playwright test tests/e2e/visual.spec.ts --project=desktop` | **fails**: see §3 |

The skipped e2e tests are each project's deliberate skips (desktop-only or mobile-only behaviour) plus the opt-in
`VISUAL` and `PERF` checks.

Baseline at the start of Task 12: 45 unit, 133 e2e passed / 23 skipped. After the deferred fold-ins (commit `e97b793`):
45 unit, 143 passed / 31 skipped. Task 12 adds 37 passing e2e runs (across both projects), 9 skips (opt-in `VISUAL` / `PERF`, project-gated tests) e2e tests and 2 unit tests. No existing test was weakened.

`scripts/with-server.mjs` runs a command against `next start` on port 3100. It refuses to start if something already
listens there (a stale server would serve an old build). It stops the server by PID (`taskkill /PID <pid> /T /F`).

## 2. Lighthouse (mobile)

Command:

```bash
npm run build && CHROME_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" node scripts/with-server.mjs \
  "npx --yes lighthouse@latest http://localhost:3100 --quiet --chrome-flags=--headless=new \
   --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=<file>"
```

The setup was Lighthouse 13.6.0 on headless Edge 156, with the default mobile emulation: 412 × 823 at DPR 1.75,
simulated slow 4G and 4× CPU.

**Hero tier measured: lite (live 3D).** The 909 KB three.js chunk was requested and no poster image was requested. The
emulated phone has no fine pointer and is narrower than 1024 px, so `decideHeroTier` picks `lite`; a Playwright check at the same emulation (412 × 823, DPR 1.75, touch) reads `data-tier="lite"`, no fine pointer and one canvas. The
spec's SwiftShader re-run applies only when Lighthouse gets the poster tier, so it was not needed.

Final build, three runs (median in bold):

| Run | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI | 3D chunk loaded | Poster requested | Failing a11y audits |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 57 | 96 | 100 | 100 | 0.9 s | 4.2 s | 1,920 ms | 0 | 3.8 s | yes | no | color-contrast |
| 2 | 72 | 96 | 100 | 100 | 0.8 s | 0.8 s | 1,300 ms | 0 | 4.8 s | yes | no | color-contrast |
| 3 | 59 | 96 | 100 | 100 | 0.8 s | 4.0 s | 1,760 ms | 0 | 3.9 s | yes | no | color-contrast |
| **median** | **59** | **96** | **100** | **100** | **0.8 s** | **4.0 s** | **1,760 ms** | **0** | **3.9 s** | | | |

The JSON files are in `.superpowers/sdd/2026-10-31-ca-firm-website/t12/lh-final-{1,2,3}.json`, which is not committed.

Budgets (G5): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.05,
TBT ≤ 200 ms.

| Budget | Median | Pass |
|---|---|---|
| Performance ≥ 90 | 59 | **no** |
| Accessibility ≥ 95 | 96 | yes |
| Best Practices ≥ 95 | 100 | yes |
| SEO ≥ 95 | 100 | yes |
| LCP ≤ 2.5 s | 4.0 s | **no** |
| CLS ≤ 0.05 | 0 | yes |
| TBT ≤ 200 ms | 1,760 ms | **no** |

The first three runs were before the Step 7 fixes. They were 56 / 57 / 70 Performance, Accessibility 96 with two
failing audits, LCP 4.2 / 4.1 / 0.9 s and TBT 2,010 / 2,110 / 1,560 ms. Run 3's LCP of 0.9 s shows how much this
laptop's noise moves Lighthouse's observed trace.

### Where the time goes

- **LCP.** The LCP element is the hero sub-copy, a `data-hero-fade` paragraph. M1 starts it at opacity 0 and fades it in
  after hydration and `document.fonts.ready`, so LCP waits for hydration, under 4× CPU, plus all five font files
  (190 KB). Observed unthrottled LCP: 1.4 s; Lighthouse's simulation: about 4.1 s. That floor is set by M1.
- **TBT.** Load-phase trace of the lite tier at 4× CPU (`t12/trace-load.mjs`), with the long tasks in order:
  - First layouts: 208 and 279 ms.
  - Framework chunk evaluation: 277 ms.
  - React hydration: 115, 178 and 63 ms.
  - three.js evaluation when the canvas mounts: 688 ms.
  - React Three Fiber's first render, which compiles the shaders: 264 ms.
  - The first scene frames: 137 ms, then about 50 ms each under software GL.

### Levers (brief Step 6), measured before applying

- **Mount the lite tier on first scroll or pointer, or wait longer before mounting.** Both keep the canvas out of an
  interaction-free Lighthouse run. Upper bound measured by blocking the three.js chunk
  (`--blocked-url-patterns=*2re9fz07ee9qo*`): Performance 61, LCP 4.1 s, TBT 1,190 ms. That is +4 to +5 points: the
  hydration and React work remains, and LCP does not move.
  - **Not applied.** Phones would show an empty stage until the first touch, because the poster loads only for reduced
    motion and forced-poster visitors. Spec §6 also says the canvas "mounts … after first paint, renders its first frame,
    then crossfades", not on interaction.
- **Lower the lite tier's DPR or page count.** DPR is already 1. The pages are one instanced draw call, so this does
  not touch the measured cost (module evaluation, shader compile).
- **Trim font axes or weights.** Spec §5 pins Fraunces opsz 9–144, wght 300–700 and italic, and the italic is used by
  the Practice emphasis. Manrope (24 KB) and Plex Mono 400/500 (10 KB each) are already small.

No allowed lever reaches 90, so none was applied. The Performance budget stays a concern for the owner (§7).

### Accessibility

- **Fixed:** `label-content-name-mismatch` (WCAG 2.5.3) on the header home link. Its aria-label replaced the visible text,
  so the monogram it shows was not in the announced name. The link now takes its name from its own text plus a
  screen-reader-only ", home" (commit `02bc678`).
- **Spec-pinned:** `color-contrast` on the M6 practice statement. At scroll 0 its unread words sit at opacity 0.18 (spec
  M6: "words fade 0.18 → 1"), and they reach full ink as the statement is read. Under reduced motion they are always
  full ink.

## 3. Long tasks while scrolling (4× CPU throttle)

The test scrolls 40 × 250 px wheel steps at 60 ms on the desktop project, with Edge's SwiftShader launch args.

| Run | Hero tier | Long tasks > 50 ms |
|---|---|---|
| Before Step 7, WebGL on | full | 39 tasks, 53–492 ms |
| Before Step 7, `PERF_NO_WEBGL=1` | poster | 28 tasks, 50–111 ms |
| Final, WebGL on | full | 36 tasks, 51–317 ms |
| Final, `PERF_NO_WEBGL=1` | poster | 30 tasks, 51–198 ms |
| Reduced motion (no Lenis, no scroll motion), 3 runs | poster | 0, 0, 0 |
| Poster tier, same build, 3 repeat runs | poster | 1, 19, 13 tasks (max 62–104 ms) |

- **With the scene, under SwiftShader:** the scene's software rendering adds the largest tasks, up to 492 ms.
- **Without WebGL:** long tasks remain. They are real main-thread work, not software-GL cost. A trace splits each one
  (one frame) into:
  - script (Lenis `raf` and its `window.scrollTo`, ScrollTrigger updates, GSAP renders);
  - `requestAnimationFrame` callbacks;
  - style recalculation;
  - wheel event dispatch.

  A CPU profile names three sources:
  - Lenis's per-frame `window.scrollTo`, which forces layout (513 ms self time across the run);
  - GSAP's transform renders;
  - GSAP's `getComputedStyle` reads when a reveal tween starts.

  Located by scroll position, the tasks cluster where the Services rows and their hairlines reveal together.
- **Floor:** under reduced motion, which has no Lenis and no scroll-driven motion, the same scroll produces **no**
  long tasks. The cost is the motion system pinned by spec §7 (Lenis smooth wheel, M3/M4/M6/M8 scroll motion).
- **Run-to-run spread is wide:** 1 to 19 tasks on identical runs. One experiment, running Lenis first in the GSAP ticker
  so its scroll write lands before the tween renders, made no difference outside that noise and was reverted.

The assertion (`no task > 50 ms`) was kept as written and fails. Removing or shortening inventory motion is not an
allowed fix.

## 4. Review findings

Each review is listed with its findings, the fix (with commit) or the reason it is out of scope.

### Deferred review minors folded in (commit `e97b793`)

| Finding | Fix |
|---|---|
| Header after a cross-page hash landing could be hidden (desktop) or stale-transparent (mobile) | `jump()` marker around the route-change landing; header re-measures and updates `onRefresh` |
| Reduced motion: same-page hash links did not move focus | Click handler always moves focus to the target (`tabindex=-1`) |
| Process steps showed final state before hydration, then jumped | CSS start state under `html.js.motion-ok`, matching ProcessMotion's `matchMedia` |
| Magnetic pull could exceed 8 px towards a corner | Pull clamped by vector length |
| Hero copy over the fan's crown at short heroes | Mockup scrim, anchored in px to the copy; z-order between stage and copy, both tiers; hidden in poster capture |
| Reduced-motion poster lacked fetch priority | `fetchpriority="high"` on the poster `<img>` |
| (found while testing the scrim) | `-z-20` on the poster was never generated: Tailwind cannot extract a class glued to `${…}`. The poster stacked above the canvas and scrim. Class string restructured. |

### baseline-ui: `components/**/*.tsx`, spacing, type and layout only (commit `027724f`)

| Finding | Fix / reason |
|---|---|
| Headings not balanced ("Company Law & / ROC" at 390 px), paragraphs left a lone last word ("audits.") | `h1–h3 { text-wrap: balance }`, `p { text-wrap: pretty }` |
| `tabular-nums` for data | No data tables. The numbers that change are none; labels are monospace. Not applicable. |
| Arbitrary z-index | The scale is −30 / −20 / −10 / −5 (hero stack), 40 (header), 50 (menu). Consistent. |
| `tracking-*`, gradients, custom easing, `motion/react` | Spec-pinned type and motion system (docs/skills.md says baseline-ui's stack and animation rules do not apply) |
| Process single column on tablet | Spec: "desktop pinned, mobile stacked". Kept. |

### review-animations + animation-performance (commit `53463fe`)

| Before | After | Why |
|---|---|---|
| Call button and hero corner arrows static | `.arrow-nudge`: x 4 px, 200 ms `--ease-out`, hover (fine pointer) + focus-visible, none under reduced motion | Spec M13 "arrow nudge x 4 px" was missing |
| `.btn` transitions `border-color` | `transform` only | Nothing changes the border; an unused transitioned property |
| Scene renders every frame behind the open (opaque) menu | Paused while `#site-menu` is not inert; resumes as the close wipe starts | The observer still counts the hero as on screen |

Reviewed and kept:

- **Header blur.** It snaps on while the surface fades over 200 ms. Animating `backdrop-filter` costs more than it gives.
- **Menu.** It animates on keyboard open: spec M12 pins it.
- **Global 0.01 ms reduced-motion safety net.** Spec §9 pins it, and every state change still happens.
- **Clip-path menu wipe.** Spec M12.

Verified from code:

- Every animation is on `transform` or `opacity`, except the wipe, which animates `clip-path`.
- There is no `will-change` and no `transition: all`.
- Hover is gated on `(hover: hover) and (pointer: fine)`.
- The scene keeps its animated values in refs with `useFrame`, never React state.

Main-thread cost while scrolling: see §3.

### break-ui (commits `e7f90b8`, Monogram in the same commit)

The temporary content was a 40-character firm name ("Venkataraghavan Chandrasekaran & Co. LLP"), monogram "VC&C",
partners "Venkatasubramanian Raghunathan", "Lakshminarayanan Chandrasekhar", "Srinivasaraghavan Padmanabhan" and "Jo Rao",
and email `partners.office@venkataraghavanchandrasekaran.co.in`. It was checked at 320, 360, 390, 640, 768, 1024, 1280
and 1440 px, then **reverted**: `git diff content/site.ts` is empty.

| # | Severity | Field | What happened | Fix |
|---|---|---|---|---|
| 1 | Broken | email | Unbreakable address widened the page to 432 px at 320–390 px. The fixed header followed, and the menu button went off screen and could not be clicked. | `wrap-anywhere` on the contact and menu email links |
| 2 | Broken | partner name | At 1024 px four-up cards (158 px inside) split even "Chandrasekhar"; long names ran into the next card at 640, 1024 and 1280 px | Four-up from 1280 px (two-up 640–1279), names 22 px (was 24), `wrap-break-word` as the last resort. Words stay whole at 320, 1024, 1280 and 1440 px. Only an 18-letter word at 640–670 px still breaks, inside its card. |
| 3 | Ugly | monogram | "VC&C" ran 3–4 px past its fixed tile | Type steps down for 4+ characters (`monogramType`) |

What held up:

- The 40-character firm name wraps in the header (3 lines at 320 px, still clear of the hero copy) and in the menu.
- The footer wordmark breaks between words, and the © line wraps.
- "Jo Rao" gives correct initials ("JR").

Regression tests swap the worst-case values into the rendered page and check the boxes at 320, 640, 1024, 1280 and
1440 px.

### mobile-native (commit `bf034a4`)

| Finding | Fix / reason |
|---|---|
| Tailwind's preflight makes the tap highlight transparent, so links and service rows gave no feedback on a tap | `-webkit-tap-highlight-color: rgb(241 236 228 / 0.08)` |
| Double-tap-to-zoom wait on controls | `touch-action: manipulation` on `a, button` |
| Long-press selects button labels | `user-select: none` on `button` (links stay selectable, e.g. the phone number) |
| Sticky hover | Already gated: no ungated `:hover`, Tailwind's `hover:` unused |
| Wrong height | Hero uses `100svh` (clamped); overlay is `fixed inset-0` |
| Pull-to-refresh, `overscroll-behavior` | Not applied: a scrolling document, refresh is expected |
| Notch / `viewport-fit` | Not used, so content never extends under the notch |
| `theme-color` | One value, correct for a dark-only site |
| Input zoom | No inputs |

Real-device testing is still to do (owner follow-up). These were verified in code and emulation only.

### Visual review of the captures (Step 4, re-checked on the final build)

| Finding | Fix / reason |
|---|---|
| Mobile: "Company Law & / ROC" and a lone "audits." | Fixed by baseline-ui (`027724f`): now "Company / Law & ROC", with no lone last words |
| Tablet (768 px): the call button broke "+91 00000 / 00000" in a 192 px contact column | Contact is two columns from 768 px and three from 1024 px; the number never wraps (`9112f1c`) |
| Tablet: Process is a single column with an empty right half | Spec "mobile stacked". Kept. |
| Lite tier shows aliasing at DPR 1 | Spec §6: lite is DPR 1 |
| Desktop full page: Practice dimmed, a pin spacer under Process | Artefacts of a full-page capture at scroll 0; the per-viewport frames show the settled states |

### impeccable: home page, `reference/audit.md` and `reference/polish.md`

Run notes:

- `impeccable context` was run once. It reported no PRODUCT.md. `init` and `hooks on` were never run (docs/skills.md).
- Two substitutions: the skill's question step was answered from the spec, as this run has no question tool; and its
  passes ran in this thread, as subagents are not used here.
- The detector ran once on the finished UI: `impeccable detect --json http://localhost:3100/`, plus `--viewport 390x844`.

Detector findings:

| Finding | Verdict |
|---|---|
| `hero-eyebrow-chip` ("Audit · Tax · Advisory" above the h1) | Spec-pinned (spec §4 content, M1) |
| `undersized-ui-text` 10 px header mono (designation, FRN / Est.) | Spec-pinned: "designation (mono 10)", mockup header box 10 px |
| `low-contrast` on M6 statement words (1.3–1.6:1) | Spec-pinned transient scrub state (0.18 → 1) |
| `low-contrast` on dimmed process steps (2.0–2.9:1) | Spec-pinned M8 "others 0.35" while pinned |
| `cramped-padding` on the first facts cell | False positive. The cell background is the page's own, so there is no visible edge; the text aligns with the page's left edge by design. |

Audit health, scored 0–4 per dimension:

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | Label-in-name fixed; M6/M8 transient dims are spec-pinned; full keyboard/focus paths tested |
| 2 | Performance | 2 | G5 Performance 56–70 (lite tier); long tasks while scrolling at 4× CPU (§2, §3) |
| 3 | Theming | 4 | All colour from `@theme` tokens; dark-only by design |
| 4 | Responsive | 3 | Worst-case content fixed (break-ui); two-up partner tiles are large at 1024–1279 px (owner decision) |
| 5 | Implementation integrity | 4 | Coherent with the spec and mockup; detector hits are spec-pinned or false positives |
| | **Total** | **16/20** | Good |

Polish pass:

- All findings inside the spec are fixed (the commits above).
- Re-walked with mouse, keyboard and touch emulation at 320–1440 px.
- No console errors (the home e2e test checks this).

## 5. Screenshots

Captured after the final gate run (`VISUAL=1`), converted to JPEG (max width 1440, quality 75) in
[`2026-10-31-v1-shots/`](2026-10-31-v1-shots/):

- Desktop (1440 × 900): [`desktop-hero.jpg`](2026-10-31-v1-shots/desktop-hero.jpg), [`desktop-full.jpg`](2026-10-31-v1-shots/desktop-full.jpg). Frames, one per viewport:
  [`frames-desktop-00.jpg`](2026-10-31-v1-shots/frames-desktop-00.jpg), [`frames-desktop-01.jpg`](2026-10-31-v1-shots/frames-desktop-01.jpg), [`frames-desktop-02.jpg`](2026-10-31-v1-shots/frames-desktop-02.jpg), [`frames-desktop-03.jpg`](2026-10-31-v1-shots/frames-desktop-03.jpg), [`frames-desktop-04.jpg`](2026-10-31-v1-shots/frames-desktop-04.jpg), [`frames-desktop-05.jpg`](2026-10-31-v1-shots/frames-desktop-05.jpg), [`frames-desktop-06.jpg`](2026-10-31-v1-shots/frames-desktop-06.jpg), [`frames-desktop-07.jpg`](2026-10-31-v1-shots/frames-desktop-07.jpg).
- [`laptop-1024-hero.jpg`](2026-10-31-v1-shots/laptop-1024-hero.jpg): the shortest full-tier hero (1024 × 768), where the copy meets the fan's crown, with the scrim.
- [`tablet-desktop-full.jpg`](2026-10-31-v1-shots/tablet-desktop-full.jpg): 768 × 1024, fine pointer, full page.
- Tablet (768 × 1024, touch) frames: [`frames-tablet-mobile-00.jpg`](2026-10-31-v1-shots/frames-tablet-mobile-00.jpg), [`frames-tablet-mobile-01.jpg`](2026-10-31-v1-shots/frames-tablet-mobile-01.jpg), [`frames-tablet-mobile-02.jpg`](2026-10-31-v1-shots/frames-tablet-mobile-02.jpg), [`frames-tablet-mobile-03.jpg`](2026-10-31-v1-shots/frames-tablet-mobile-03.jpg), [`frames-tablet-mobile-04.jpg`](2026-10-31-v1-shots/frames-tablet-mobile-04.jpg), [`frames-tablet-mobile-05.jpg`](2026-10-31-v1-shots/frames-tablet-mobile-05.jpg).
- Mobile (390 × 844, touch, DPR 2): [`mobile-hero.jpg`](2026-10-31-v1-shots/mobile-hero.jpg). Frames: [`frames-mobile-00.jpg`](2026-10-31-v1-shots/frames-mobile-00.jpg), [`frames-mobile-01.jpg`](2026-10-31-v1-shots/frames-mobile-01.jpg), [`frames-mobile-02.jpg`](2026-10-31-v1-shots/frames-mobile-02.jpg), [`frames-mobile-03.jpg`](2026-10-31-v1-shots/frames-mobile-03.jpg), [`frames-mobile-04.jpg`](2026-10-31-v1-shots/frames-mobile-04.jpg), [`frames-mobile-05.jpg`](2026-10-31-v1-shots/frames-mobile-05.jpg), [`frames-mobile-06.jpg`](2026-10-31-v1-shots/frames-mobile-06.jpg), [`frames-mobile-07.jpg`](2026-10-31-v1-shots/frames-mobile-07.jpg).

- Full-page desktop captures render the page at scroll 0: the pinned Process section shows its spacer, and
  scroll-revealed blocks show their pre-reveal state.
- Mobile captures are one frame per viewport. Chromium's full-page capture under mobile emulation repeats the hero
  halfway down.

## 6. Commits (Task 12)

- `37f7a58` test: add with-server runner and opt-in visual captures and long-task check
- `e97b793` fix: fold in deferred review minors (header landing, reduced-motion focus, process start state, magnetic
  clamp, hero scrim, poster priority)
- `44a33da` test: capture visual review frames per viewport under mobile emulation
- `02bc678` fix: name the header home link by the text it shows (label in name)
- `027724f` fix: balance headings and keep running text off a lone last word (baseline-ui)
- `53463fe` fix: add the M13 arrow nudge and stop the hero drawing behind the open menu (motion review)
- `e7f90b8` fix: keep worst-case names and emails inside their boxes (break-ui)
- `bf034a4` fix: answer taps in the palette and skip the double-tap wait (mobile-native)
- `9112f1c` fix: keep the phone number whole in the call button at tablet width (visual review)
- the commit adding this report and the screenshots

## 7. Owner follow-ups

1. **Real content** in `content/site.ts`, replacing every placeholder (see `content/PLACEHOLDERS.md`):
   - firm name, monogram (3 characters keeps the display size; 4 steps the type down) and designation;
   - FRN and year established;
   - partners' names, credentials and focus;
   - address, phone, email, hours and map link;
   - city and site URL.
2. **ICAI wording check.** Check the disclaimer and all copy against ICAI's current Code of Ethics, including the
   advertising and solicitation rules.
3. **Domain and hosting.** Set the real `site.url` (metadata, canonical, Open Graph), then deploy.
4. **Re-run `npm run poster`** after the real firm name lands. This regenerates the hero posters and Open Graph image
   from the live scene.
5. **Performance budget decision.** On this laptop, G5 Performance measures 59 (median of three runs; range 57–72) against a target of 90. The
   allowed levers top out at about +5 (§2). To reach 90:
   - accept the lite tier mounting on first interaction, or the poster on phones, which changes spec §6; or
   - relax M1's hidden-until-hydration start for the hero sub-copy, which changes M1.

   Re-measure on the production host and a real mid-range phone before deciding.
6. **Real devices.** Check on a real iPhone and Android phone: sticky hover, tap feedback, `100svh`, and the lite-tier
   scene's frame rate.
7. **Partners at 1024–1279 px.** The cards are now two-up with large monogram tiles, which keeps real Indian names
   whole. If four-up matters more at that width, the names must shrink to about 16 px or break mid-word.
8. **Licences.** Most installed agent skills ship no licence (docs/skills.md). Check before making the repository
   public.
