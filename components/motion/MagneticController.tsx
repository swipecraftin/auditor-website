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
          // Pointer offset from the centre, each axis normalised to the half-size (±1 at the edges).
          const nx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
          const ny = (e.clientY - r.top - r.height / 2) / (r.height / 2);
          // "Max 8 px" bounds the length of the pull: towards a corner both axes pull, so scale the vector, not each axis.
          const scale = STRENGTH / Math.max(1, Math.hypot(nx, ny));
          xTo(nx * scale);
          yTo(ny * scale);
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
