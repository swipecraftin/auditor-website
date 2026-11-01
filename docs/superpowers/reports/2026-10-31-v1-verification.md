# v1 verification: gates, performance, reviews

Date: 2026-11-01. Branch `feat/site-v1`. Task 12 of the plan `docs/superpowers/plans/2026-10-31-ca-firm-website.md`.
Spec: `docs/superpowers/specs/2026-10-31-ca-firm-website-design.md`.

Scratch tools, logs and raw Lighthouse JSON cited as `t12/…` live in `.superpowers/sdd/2026-10-31-ca-firm-website/t12/`.
That folder is git-ignored and local to the machine that ran this verification.

**Result: the gates pass, and so do the Lighthouse Accessibility, Best Practices and SEO budgets. The Performance budget
(G5) and the long-task check do not pass.** The real numbers are below, with what the misses come from and the levers
that were measured.

**Builds.** Every measurement below names the commit it was taken on. Fix round 1 (commits `8b2fe57` – `186699a`)
removed two scroll-time costs and re-ran every gate and measurement. The app code (`app`, `components`, `lib`,
`content`, `public`, `scripts`, `next.config.ts`, `package.json`) is identical from `3deae44` to the final HEAD; the
later commits change only opt-in tests and this report.

## 1. Commands and results

| Gate | Command | Build | Result |
|---|---|---|---|
| Unit | `npm test` | `186699a` | 47 passed (7 files) |
| Lint | `npm run lint` | `186699a` | clean |
| Types | `npm run typecheck` | `186699a` | clean |
| E2E | `npx playwright test` (Edge, desktop + mobile projects) | `186699a` | **173 passed, 33 skipped** (10.7 min) |
| Visual captures | `VISUAL=1 npx playwright test tests/e2e/visual.spec.ts` | `186699a` | 5 passed, 3 skipped (the PERF check in both projects; the 1024 px laptop capture on mobile) |
| Long tasks | `PERF=1 npx playwright test tests/e2e/visual.spec.ts --project=desktop` | `186699a` | **fails**: see §3 |

The skipped e2e tests are each project's deliberate skips (desktop-only or mobile-only behaviour) plus the opt-in
`VISUAL` and `PERF` checks. The full gate ran on `3deae44` (`t12/fr1-gate2.log`) and again on `186699a`
(`t12/fr1-gate3.log`), with the same counts both times.

Baseline at the start of Task 12: 45 unit, 133 e2e passed / 23 skipped. After the deferred fold-ins (commit `e97b793`):
45 unit, 143 passed / 31 skipped. Task 12 adds 40 passing e2e runs across both projects, 10 skips (the opt-in `VISUAL`
/ `PERF` checks and project-gated tests) and 2 unit tests. No existing test was weakened.

`scripts/with-server.mjs` runs a command against `next start` on port 3100. It refuses to start if something already
listens there (a stale server would serve an old build). It stops the server by PID (`taskkill /PID <pid> /T /F`).

## 2. Lighthouse (mobile)

Command:

```bash
npm run build && CHROME_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" node scripts/with-server.mjs \
  "npx --yes lighthouse@13.6.0 http://localhost:3100 --quiet --chrome-flags=--headless=new \
   --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=<file>"
```

The setup was Lighthouse 13.6.0 (pinned in fix round 1; the earlier runs used `@latest`, which resolved to 13.6.0) on
headless Edge 156, with the default mobile emulation: 412 × 823 at DPR 1.75, simulated slow 4G and 4× CPU.

**Hero tier measured: lite (live 3D).** In every run the 909 KB three.js chunk was requested and no poster image was
requested. The emulated phone has no fine pointer and is narrower than 1024 px, so `decideHeroTier` picks `lite`; a
Playwright check at the same emulation (412 × 823, DPR 1.75, touch) on `3deae44` reads `data-tier="lite"`, no fine
pointer and one canvas (`t12/tier-lh.mjs`). The spec's SwiftShader re-run applies only when Lighthouse gets the poster
tier, so it was not needed.

**Build `3deae44`**, three runs (median in bold). The batch started at 01:33:47 +0530 on 2026-11-02 with `HEAD 3deae44`
and a clean tree (`t12/fr1-final-head.txt`); `3deae44` was committed at 01:22:14 +0530. The runs' `fetchTime` is
20:08:14Z, 20:08:41Z and 20:09:07Z on 2026-11-01, that is 01:38:14 – 01:39:07 +0530 on 2026-11-02. The app code is
the same at the final HEAD (see "Builds" above).

| Run | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI | 3D chunk loaded | Poster requested | Failing a11y audits |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 56 | 96 | 100 | 100 | 1.0 s | 4.3 s | 2,370 ms | 0 | 3.5 s | yes | no | color-contrast |
| 2 | 56 | 96 | 100 | 100 | 0.9 s | 4.2 s | 1,920 ms | 0 | 3.9 s | yes | no | color-contrast |
| 3 | 58 | 96 | 100 | 100 | 0.8 s | 4.0 s | 1,900 ms | 0 | 3.7 s | yes | no | color-contrast |
| **median** | **56** | **96** | **100** | **100** | **0.9 s** | **4.2 s** | **1,920 ms** | **0** | **3.7 s** | | | |

The JSON files are `t12/lh-fr1-{1,2,3}.json` (not committed).

Budgets (G5): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.05,
TBT ≤ 200 ms.

| Budget | Median (`3deae44`) | Pass |
|---|---|---|
| Performance ≥ 90 | 56 | **no** |
| Accessibility ≥ 95 | 96 | yes |
| Best Practices ≥ 95 | 100 | yes |
| SEO ≥ 95 | 100 | yes |
| LCP ≤ 2.5 s | 4.2 s | **no** |
| CLS ≤ 0.05 | 0 | yes |
| TBT ≤ 200 ms | 1,920 ms | **no** |

Earlier runs, by build:

- **`bf034a4`** (`t12/lh-final-{1,2,3}.json`, fetchTime 17:42–17:43Z = 23:12–23:13 +0530 on 2026-11-01, before
  `9112f1c` at 23:22:19). Before fix round 1 these were reported here as the "final build"; `9112f1c` changed only the
  Contact grid classes. Performance 57 / 72 / 59 (median 59), Accessibility 96, Best Practices 100, SEO 100, LCP
  4.2 / 0.8 / 4.0 s, TBT 1,920 / 1,300 / 1,760 ms, CLS 0.
- **`44a33da`**, before the Step 7 fixes (`t12/lh-mobile-{1,2,3}.json`): Performance 56 / 57 / 70, Accessibility 96
  with two failing audits, LCP 4.2 / 4.1 / 0.9 s, TBT 2,010 / 2,110 / 1,560 ms.

The `3deae44` median (56) sits inside the earlier spread (56–72). The only load-phase change in fix round 1 is the
one-time reveal prime, measured at 1.8 – 19.3 ms of forced reads at 4× CPU on desktop and 2.0 – 3.5 ms in the
Lighthouse-like mobile emulation (§3), too small to account for that spread. LCP values of 0.8 – 0.9 s in single runs
show how much this laptop's noise moves Lighthouse's observed trace.

### Where the time goes

- **LCP.** The LCP element is the hero sub-copy, a `data-hero-fade` paragraph. M1 starts it at opacity 0 and fades it in
  after hydration and `document.fonts.ready`, so LCP waits for hydration, under 4× CPU, plus all five font files
  (190 KB). Observed unthrottled LCP: 1.4 s; Lighthouse's simulation: about 4.1 s. That floor is set by M1.
- **TBT.** Load-phase trace of the lite tier at 4× CPU (`t12/trace-load.mjs`, on `44a33da`), with the long tasks in order:
  - First layouts: 208 and 279 ms.
  - Framework chunk evaluation: 277 ms.
  - React hydration: 115, 178 and 63 ms.
  - three.js evaluation when the canvas mounts: 688 ms.
  - React Three Fiber's first render, which compiles the shaders: 264 ms.
  - The first scene frames: 137 ms, then about 50 ms each under software GL.

### Levers (brief Step 6), measured before applying

- **Mount the lite tier on first scroll or pointer, or wait longer before mounting.** Both keep the canvas out of an
  interaction-free Lighthouse run. Upper bound measured on `44a33da` by blocking the three.js chunk
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

The check (`tests/e2e/visual.spec.ts`, `PERF=1`) scrolls 40 × 250 px wheel steps at 60 ms on the desktop project with
Edge's SwiftShader launch args, and asserts that no task is over 50 ms. The assertion is unchanged, and it still fails.

**Fix round 1 in one paragraph.** Two scroll-time costs in the implementation were found and removed. Each removal is
checked by its own deterministic e2e test, not by the long-task count:

1. **Reveal start reads** (`8b2fe57`). A reveal or hairline tween that started inside a scroll frame made GSAP read the
   element's computed opacity and transform back, and its `offsetHeight` while it was translated. Those are forced
   style recalcs and layouts mid-scroll: 184 reads per PERF scroll, 16 of them layouts. PageMotion now hands GSAP the
   CSS start values once at setup. The new test, which steps through the page with `scrollTo`, counts **116 reads
   per project before, 0 after** on `[data-reveal]` / `[data-line]` elements. A scroll now makes 70 reads, all `getComputedStyle` on split text, with no layout (below).
2. **Hover transitions under the resting pointer** (`b4221f3`, comments corrected in `038575e`, test hardened in
   `3deae44`). As Lenis scrolled the page under a still pointer, every service row and partner card on the way past
   started its hover transitions: **31 transitions per PERF scroll before, 1 after**, counted in a trace of the same
   scroll. Hover styles now wait on `html:not(.lenis-scrolling)`.

**The official count did not measurably fall.** On this laptop, identical runs of one build in one session range from
5 to 14 tasks, which is larger than either effect (rows below). What remains is attributed by the experiments in "Where
the remaining tasks come from".

### The official check, by build

| Build | Hero tier | Playwright trace | Long tasks > 50 ms, per run |
|---|---|---|---|
| `e97b793` (before Step 7) | full | recorded | 39 (53–492 ms) |
| `e97b793` | poster (`PERF_NO_WEBGL=1`) | recorded | 28 (50–111 ms) |
| `bf034a4` (reported as "final" before this round) | full | recorded | 36 (51–317 ms) |
| `bf034a4` | poster | recorded | 30 (51–198 ms) |
| `3deae44` | full | recorded | 41, 24, 39 (50–713 ms) |
| `3deae44` | poster | recorded | 31, 31, 37 (49–153 ms); a fourth run: 35 (50–108 ms) |
| `3deae44` | full | off (`--trace off`) | 15, 19, 20 (50–358 ms) |
| `3deae44` | poster | off | 13, 12, 14 (51–126 ms) |
| **`186699a`** (final; tracing off in the spec) | full | off | 14, 27, 27 (50–341 ms) |
| **`186699a`** | poster | off | 9, 13, 18 (50–87 ms) |

Logs: `t12/perf1*.log` (`e97b793`), `t12/perf2*.log` (`bf034a4`), `t12/fr1-perf*.log` (`3deae44`),
`t12/fr1-perf-final*.log` (`186699a`).

**Playwright's trace recorder inflated every earlier row.** The config records a trace for every test
(`trace: "retain-on-failure"`). The recorder takes a DOM snapshot in the page before and after each action, on the
page's main thread, and the long-task observer counts that work as the page's. One recorded PERF run holds 174 frame
snapshots and 213 screencast frames (`t12/perf-trace/`). On one build (`3deae44`, poster tier), the counts were 31, 31
and 37 with the recorder and 13, 12 and 14 without. `visual.spec.ts` now records no trace (`186699a`). The assertion is
byte-identical, and the console line still lists every task.

**With the scene, under SwiftShader**, the scene's software rendering adds the largest tasks, up to 713 ms. That is
software-GL cost, which a GPU does not have.

### Where the remaining tasks come from

These are same-session experiments with the PERF measurement in a scratch runner (`t12/lt-runs2.mjs`,
`t12/lt-runs3.mjs`). They use the same scroll and the same 4× throttle, the poster tier (WebGL stubbed) and no
Playwright trace. The experiment builds are the named commit's code plus three temporary `window.__*` flags in
`MotionProvider.tsx`: Lenis off, Lenis forced on, and Lenis first in the GSAP ticker. The flags were never committed,
and `git diff components/motion/MotionProvider.tsx` is empty. Compare rows within a session only: the laptop's state
moves the whole session.

| Session | Build | Mode | Long tasks per run | Median |
|---|---|---|---|---|
| 1 | app code of `ea26623` (before the prime) | normal | 13, 11, 7, 7, 9 | 9 |
| 1 | `8b2fe57` (prime) | normal | 0, 12, 7, 5, 2 | 5 |
| 2 | `8b2fe57` + flags | normal | 11, 5, 8, 12, 8 | 8 |
| 2 | | Lenis off, all scroll motion on | 2, 5, 4, 4, 5 | 4 |
| 2 | | Lenis on, no scroll motion (reduced motion with Lenis forced on)¹ | 0, 1, 1, 0, 0 | 0 |
| 2 | | reduced motion (no Lenis, no scroll motion)¹ | 0, 0, 0, 0, 0 | 0 |
| 3 | `8b2fe57` + flags | normal | 9, 7, 16, 5, 9, 9, 12 | 9 |
| 3 | | Lenis first in the GSAP ticker (its scroll write before the tween renders) | 11, 8, 4, 5, 11, 10, 19 | 10 |
| 3 | | Lenis off | 4, 3, 3, 1, 2, 3, 2 | 3 |
| 4 | `8b2fe57` + flags | normal | 0, 17, 7, 8, 3, 7, 7 | 7 |
| 4 | | no pointer hits on the content (`pointer-events: none` on main and footer) | 4, 3, 3, 5, 3, 5, 6 | 4 |
| 4 | | Lenis off and no pointer hits | 1, 0, 2, 1, 3, 0, 2 | 1 |
| 5 | `b4221f3` + flags (hover gate) | normal | 5, 12, 12, 4, 9, 5, 5 | 5 |
| 5 | | no pointer hits | 3, 4, 8, 2, 2, 10, 6 | 4 |
| 5 | | Lenis off | 3, 4, 6, 5, 11, 4, 4 | 4 |
| 6 | `3deae44` (no flags) | normal | 5, 14, 10, 6, 13 | 10 |

¹ A shorter page: without the process pin's 200 % spacer the scroll ends at 3,912 px instead of 5,712 px.

What the table shows:

- **Neither Lenis nor the scroll motion makes many long tasks alone.**
  - With Lenis and no scroll motion: 0 to 1. This comparison has a confound: that page is shorter and has no pin.
  - With the scroll motion, native scrolling and no pointer hits: median 1.
  - With both: median 7 to 10 before the hover gate.
- **Pointer hits were a large share of that.** Removing them took Lenis plus motion from 7 to 4 (session 4), and the
  hover gate comes close to that (session 5: 5 against 4).
  - The gate removes the transitions.
  - The pointer boundary events stay: 33 `pointerover` and 32 `pointerout` per scroll, about 170 ms of dispatch at 4×.
  - Hover work exists under native scrolling too in this headless Edge: Lenis off was 3 (session 3), and 1 without
    pointer hits (session 4). Those are different sessions, so this is indicative only.
- **Lenis's per-frame scroll write is the largest script-side cost of what is left.**
  - A CPU profile of the scroll at `3deae44` (`t12/profile-scroll.mjs`) gives `window.scrollTo` 561 ms of self time, the
    largest single entry. The frame's forced style recalc runs inside it.
  - All of GSAP's chunk together is 718 ms.
  - Each Lenis frame also dispatches a `scroll` and a `scrollend` event: 122 of each per scroll.
  - Running Lenis first in the ticker, so that its write comes before the tween renders, did not help (median 10
    against 9).
- **Each remaining long task is one frame.** A trace of the scroll at `3deae44` (`t12/trace-scroll.mjs`, 10 long tasks
  in that run) splits them into:
  - script: about 30 ms per task, mostly `requestAnimationFrame` (the GSAP ticker driving Lenis, ScrollTrigger and the
    renders);
  - event dispatch: 115 ms in total;
  - style recalculation: 94 ms;
  - paint, layerize and commit: about 140 ms;
  - hit tests: 36 ms.

  Located by scroll position, the tasks fall where scroll motion starts or runs: the Practice statement (M6), the
  Services rows and hairlines (M3/M4), Contact (M3) and the footer wordmark (M14).
- **The residual reads are left as they are.** The 70 reads per scroll fall on split text: the wordmark's characters
  (36), the M6 words (16), the Facts values' lines (12) and one heading's lines (3).
  - They are `getComputedStyle` only, with no layout, about 95 ms of GSAP's computed-style helper at 4× over the
    whole scroll.
  - Those `from()` tweens parse their targets when created. ScrollTrigger's refresh reverts them and marks the cache
    stale, so they parse again when they start.
  - They are outside the two sources the review named, and were not changed.
- **The prime's own cost is at load, once.**
  - The one-time `gsap.set` plus the above-the-fold reveals read 192 values at load: 1.8 – 19.3 ms inside the reads at
    4× CPU on desktop, and 2.0 – 3.5 ms in the Lighthouse-like mobile emulation (`t12/load-reads.mjs`, three runs each
    on `8b2fe57` and on `3deae44`).
  - These are upper bounds: the timing proxy adds its own overhead.

**Floor.** What remains comes from two things together: the Lenis integration that spec §7.3 pins (`lerp: 0.1`,
`smoothWheel: true`, the GSAP ticker driving `lenis.raf`, `lenis.on("scroll", ScrollTrigger.update)`) and the
inventory's scroll motion (M3, M4, M5, M6, M8, M14), at 4× CPU. The levers left are dropping Lenis or its smooth wheel,
which spec §7.3 rules out, or shortening or removing scroll motion, which the brief forbids. So the check stays red for
the owner to decide (§7).

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

### review-animations + animation-performance (commit `53463fe`; fix round 1: `8b2fe57`, `b4221f3`)

| Before | After | Why |
|---|---|---|
| Call button and hero corner arrows static | `.arrow-nudge`: x 4 px, 200 ms `--ease-out`, hover (fine pointer) + focus-visible, none under reduced motion | Spec M13 "arrow nudge x 4 px" was missing |
| `.btn` transitions `border-color` | `transform` only | Nothing changes the border; an unused transitioned property |
| Scene renders every frame behind the open (opaque) menu | Paused while `#site-menu` is not inert; resumes as the close wipe starts | The observer still counts the hero as on screen |
| A reveal or hairline tween starting mid-scroll read the element's computed opacity and transform (and `offsetHeight` while translated): 184 forced reads per scroll, 16 of them layouts | PageMotion primes the same start values once at setup (`gsap.set`, before the batches; the CSS still covers the page until hydration). Reveal and hairline reads per scroll: 116 → 0 (`8b2fe57`) | Spec §7.6 / G2: no long task while scrolling. Fix round 1, review finding 1 |
| Rows and cards passing under a resting pointer started their hover transitions while Lenis scrolled: 31 per scroll | Every hover rule waits on `html:not(.lenis-scrolling)`; 1 transition per scroll (`b4221f3`) | Same. Hover is deferred until the scroll settles (Lenis clears the class when its smooth scroll comes to rest, and 0.4 s after a native scroll), not removed or shortened. Clicks are untouched; with no Lenis (reduced motion) hover is immediate |

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

### Visual review of the captures (Step 4, re-checked on `9112f1c`; the fix-round-1 set on `186699a` spot-checked)

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

Captured with `VISUAL=1` on `186699a`, the final app code (`t12/fr1-visual2.log`), and converted to JPEG (max width
1440, quality 75) in [`2026-10-31-v1-shots/`](2026-10-31-v1-shots/). Fix round 1 replaced the whole set: the old files
were deleted before the conversion, so no frame is left over from `9112f1c`, where the previous set was taken.

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
- `14760fe`, `ea26623` docs: the verification report and screenshots
- Fix round 1:
  - `8b2fe57` perf: prime reveal and hairline start values at setup so scroll-time reveals read nothing back
  - `b4221f3` perf: hold hover styles while Lenis scrolls so rows passing under a resting pointer start no transitions
    (its message says hover lands "as under native scrolling"; that was not measured, and `038575e` corrected the
    comments)
  - `038575e` docs: say only what was measured in the hover-gate comments
  - `3deae44` test: hold the stand-in scroll class so Lenis's own class rewrite cannot race the hover-gate test
  - `61a8d1c` test: run the long-task check without Playwright's trace recorder; give the desktop capture time (it put
    the trace option in a `describe`, which Playwright rejects, so the spec did not load)
  - `186699a` test: turn tracing off at file level in the visual spec
  - the commit updating this report and the screenshots

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
5. **Performance budget decision.** On this laptop, G5 Performance measures 56 (median of three runs on `3deae44`;
   range 56–58; 57–72 on `bf034a4`) against a target of 90. The allowed levers top out at about +5 (§2). To reach 90:
   - accept the lite tier mounting on first interaction, or the poster on phones, which changes spec §6; or
   - relax M1's hidden-until-hydration start for the hero sub-copy, which changes M1.

   Re-measure on the production host and a real mid-range phone before deciding.
6. **Real devices.** Check on a real iPhone and Android phone: sticky hover, tap feedback, `100svh`, and the lite-tier
   scene's frame rate.
7. **Partners at 1024–1279 px.** The cards are now two-up with large monogram tiles, which keeps real Indian names
   whole. If four-up matters more at that width, the names must shrink to about 16 px or break mid-word.
8. **Licences.** Most installed agent skills ship no licence (docs/skills.md). Check before making the repository
   public.
9. **Scroll long tasks (G2).** At 4× CPU the scroll still makes long tasks (9 to 18 tasks of 50–87 ms per scroll in the poster tier
   on `186699a`, §3). What remains comes from the Lenis smooth wheel that spec §7.3 pins together with the scroll
   motion. The options are to accept it, to drop Lenis's smooth wheel (a change to spec §7.3), or to thin the scroll motion
   (a change to the motion inventory). Check on a real mid-range laptop and phone first: this laptop's spread is wide.
