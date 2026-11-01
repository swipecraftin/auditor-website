"use client";

import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { dur, stagger } from "@/lib/motion";
import { isMotionOk } from "./motion-env";

type SplitMode = "intro" | "lines" | "chars" | "words-scrub";

// Reveal start lines (spec M3 "top 85%"). They stay unclamped: content that starts above the fold has a negative natural
// start, so at scroll 0 its trigger is already past the start, is active at load and reveals at once.
// clamp() would force that start to 0, keep progress at 0 at scroll 0 and leave the content hidden until the first scroll.
// Only the footer wordmark keeps clamp(): it sits at the very bottom, where its natural start can lie past the maximum
// scroll (clamp pulls it back to max - 1 so it still fires). Known edge: on a page only slightly taller than the viewport,
// with the wordmark already above the 90 % line at load, its start clamps to 0 and it waits for the first scroll.
const START = { reveal: "top 85%", line: "top 90%", chars: "clamp(top 90%)" } as const;

/** Text of a heading with each <br> read as a space (SplitText's own aria-label would glue "Clarity," to "line"). */
function headingLabel(el: HTMLElement) {
  return Array.from(el.childNodes, (n) => (n.nodeName === "BR" ? " " : (n.textContent ?? "")))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

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
        scrollTrigger: { trigger: el, start: START.chars, once: true },
      });
    case "intro": // M1 — hero headline, budget ≤ 1.2 s after fonts are ready
      return gsap.from(self.lines, { yPercent: 110, duration: dur.heroLines, ease: "expo.out", stagger: stagger.editorial, delay: 0.1 });
    default: // M5 / M10 — line mask reveals
      return gsap.from(self.lines, {
        yPercent: 110, duration: dur.lines, ease: "expo.out", stagger: stagger.editorial,
        scrollTrigger: { trigger: el, start: START.reveal, once: true },
      });
  }
}

/** gsap.set on what `selector` matches; a page without such elements (the disclaimer has no hairlines) sets nothing. */
function prime(selector: string, vars: gsap.TweenVars) {
  const targets = gsap.utils.toArray<HTMLElement>(selector);
  if (targets.length) gsap.set(targets, vars);
}

export function PageMotion() {
  const pathname = usePathname();

  useGSAP(
    (_context, contextSafe) => {
      if (!isMotionOk() || !contextSafe) return;

      // The CSS start states (globals.css) cover the page until hydration. Hand the same values to GSAP now, before the
      // batches: GSAP reads an element's computed opacity and transform (and, while it is translated, its offsetHeight)
      // the first time it tweens it, and a reveal starts inside a scroll frame, after that frame's style writes, so each
      // read there forces a style recalc or a layout mid-scroll (spec §7.6). One set reads all its targets, then writes.
      // Before the batches, so content above the fold is never hidden again after its reveal starts.
      prime("[data-reveal]:not([data-reveal='scale'])", { opacity: 0, y: 24 });
      prime("[data-reveal='scale']", { opacity: 0, scale: 0.96 });
      prime("[data-line]", { scaleX: 0 });

      // M3 / M9 — blocks fade up (cards also scale from 0.96)
      ScrollTrigger.batch("[data-reveal]", {
        start: START.reveal,
        once: true,
        onEnter: (els) =>
          gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: dur.editorial, ease: "expo.out", stagger: stagger.editorial, overwrite: true }),
      });

      // M4 — hairlines draw from the left
      ScrollTrigger.batch("[data-line]", {
        start: START.line,
        once: true,
        onEnter: (els) => gsap.to(els, { scaleX: 1, duration: 1, ease: "expo.out", stagger: stagger.editorial }),
      });

      const splitAll = contextSafe(() => {
        document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
          const mode = (el.dataset.split ?? "lines") as SplitMode;
          const isHeading = /^H[1-6]$/.test(el.tagName);
          const label = isHeading ? headingLabel(el) : "";
          SplitText.create(el, {
            type: mode === "chars" ? "lines,chars" : mode === "words-scrub" ? "words" : "lines",
            ...(mode === "words-scrub" ? {} : { mask: "lines" as const }),
            // Line masks of running headings get `.split-line-mask` (globals.css): its clip reaches below the line box so
            // descenders survive tight line-heights. The wordmark keeps the plain mask (its chars start exactly one box below).
            ...(mode === "chars" || mode === "words-scrub" ? {} : { linesClass: "split-line" }),
            // Headings take an aria-label (the split wrappers are aria-hidden). Running text and values keep their
            // real text exposed instead: a label on a paragraph is not announced, so hiding its words would silence it.
            aria: isHeading ? "auto" : "none",
            autoSplit: true,
            onSplit: (self: SplitText) => {
              if (label) el.setAttribute("aria-label", label);
              return animateSplit(el, mode, self);
            },
          });
        });
        ScrollTrigger.refresh();
      });
      // contextSafe only records what splitAll creates in this context; it still runs a callback that fires after the
      // context was reverted (Strict Mode remount, or a route change before the fonts were ready). The flag stops that.
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (!cancelled) splitAll();
      });
      return () => {
        cancelled = true;
      };
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
