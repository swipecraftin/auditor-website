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
        defaults: { ease: "none" }, // spec 7.2: scrubs use no ease, Lenis supplies the smoothing
        scrollTrigger: {
          trigger: section, start: "top top", end: "+=200%", pin: true, scrub: true, anticipatePin: 1,
          // The pin spacer moves everything below the section down by 200 %. Refresh the pin before every other trigger
          // (a priority also makes ScrollTrigger refresh the rest in page order), so none of them is measured without it,
          // whatever order the controllers mounted in.
          refreshPriority: 1,
        },
      });
      if (progress) tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: steps.length - 1 }, 0);
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
