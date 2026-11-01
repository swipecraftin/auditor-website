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
  const [running, setRunning] = useState(true);
  const drivers = useMemo<SceneDrivers>(
    () => ({
      open: Array.from({ length: PAGE_COUNT }, () => ({ v: capture ? 1 : 0 })),
      light: { v: capture ? 1 : 0 },
      scroll: { v: 0 },
      pointer: { x: 0 },
    }),
    [capture],
  );

  // Stop rendering while the hero is off-screen or the tab is hidden (spec §6), and while the open menu covers it: the
  // overlay is opaque and the observer still counts the hero as on screen. The menu is inert exactly while it is closed,
  // so drawing resumes as its close wipe starts to uncover the hero.
  useEffect(() => {
    const hero = wrap.current?.closest("[data-hero]");
    if (!hero) return;
    const menu = document.getElementById("site-menu");
    let onScreen = true;
    const update = () => setRunning(onScreen && !document.hidden && !(menu && !menu.hasAttribute("inert")));
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(hero);
    const menuState = new MutationObserver(update);
    if (menu) menuState.observe(menu, { attributes: true, attributeFilter: ["inert"] });
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      menuState.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
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
      const hero = wrap.current?.closest("[data-hero]");
      if (capture || !hero) return;
      // M2 (3D) — pages fold and the camera dollies in as the hero scrolls out. The trigger is the element itself: a
      // "[data-hero]" selector would resolve inside the scope (this wrapper), find nothing and fall back to <body>.
      ScrollTrigger.create({
        trigger: hero,
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
        frameloop={running ? "always" : "never"}
        gl={{ antialias: tier === "full" || capture, powerPreference: "high-performance", preserveDrawingBuffer: capture }}
        camera={{ fov: 30, near: 0.1, far: 100, position: [0, 2.9, 12] }}
      >
        <LedgerScene tier={tier} drivers={drivers} frozen={capture} onFirstFrame={onFirstFrame} />
      </Canvas>
    </div>
  );
}
