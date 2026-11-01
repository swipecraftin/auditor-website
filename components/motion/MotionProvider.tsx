"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

function hashTarget(hash: string): HTMLElement | null {
  if (hash.length < 2) return null;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    /* malformed escape: use the raw fragment */
  }
  return document.getElementById(id);
}

/**
 * preventDefault on a hash link also cancels the browser's move of the sequential-focus starting point
 * (WCAG 2.4.3), so do it by hand. The timeout lets effects from the same click finish first: closing the menu
 * focuses the burger, and the section must win.
 */
function focusTarget(target: HTMLElement) {
  window.setTimeout(() => {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }, 0);
}

/**
 * Where a smooth scroll to `target` should stop. Lenis measures an element target from its bounding box, and a pinned
 * section's box moves with its pin (fixed at the top while pinned, translated by the pin distance after it), so the
 * landing spot would depend on where the scroll started. For a pinned section, stop at the pin's start line instead,
 * less its scroll-margin-top, exactly where an unpinned section would land.
 */
function scrollDestination(target: HTMLElement): HTMLElement | number {
  const pin = ScrollTrigger.getAll().find((trigger) => trigger.pin === target);
  if (!pin) return target;
  return pin.start - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
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
    // Capture phase + preventDefault: next/link skips its own navigation for a defaultPrevented click
    // but still runs the link's onClick (e.g. closing the menu), so <Link href="/#x"> and <a href="#x"> behave alike.
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!link || link.origin !== location.origin || link.pathname !== location.pathname || !link.hash) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const target = hashTarget(link.hash);
      if (!target) return;
      event.preventDefault();
      // The menu stops Lenis while open, and its links close it in this same click. Lenis.start() runs reset(), which
      // cancels any running scroll, so restart it before scrolling: the menu's own start() is then a no-op.
      instance.start();
      instance.scrollTo(scrollDestination(target), { force: true }); // element targets: Lenis honours scroll-margin-top
      if (location.hash !== link.hash) history.pushState(null, "", link.hash);
      focusTarget(target);
    };
    document.addEventListener("click", onClick, true);
    // Lenis needs the DOM, so it can only be created after mount; publishing it to context is this effect's job.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    return () => {
      document.removeEventListener("click", onClick, true);
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // After client-side route changes, jump to the hash (or top) and re-measure triggers.
  useEffect(() => {
    if (!lenis || lastPath.current === pathname) return;
    lastPath.current = pathname;
    lenis.scrollTo(hashTarget(location.hash) ?? 0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
