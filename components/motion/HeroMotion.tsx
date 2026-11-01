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
    // contextSafe does not skip a callback that fires after the context was reverted; the flag does.
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) intro();
    });

    // M2 (copy) — hero text drifts up and fades by 60 % of the hero scroll
    gsap.to(".hero-copy", {
      y: -80, opacity: 0, ease: "none",
      scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "60% top", scrub: true },
    });

    return () => {
      cancelled = true;
    };
  });

  return null;
}
