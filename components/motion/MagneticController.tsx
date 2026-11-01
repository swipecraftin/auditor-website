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
