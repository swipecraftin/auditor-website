"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type RefObject } from "react";
import { isMotionOk } from "@/components/motion/motion-env";
import { Monogram } from "@/components/ui/Monogram";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { HEADER_DURATION, nextHeaderState, type HeaderState } from "./header-state";

export type HeaderProps = {
  menuOpen: boolean;
  onOpen: () => void;
  burgerRef: RefObject<HTMLButtonElement | null>;
};

export function Header({ menuOpen, onOpen, burgerRef }: HeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const menuOpenRef = useRef(menuOpen);
  const pathname = usePathname();
  const { firm } = site;

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const motion = isMotionOk();
      let state: HeaderState = { hidden: false, solid: false };
      let lastY = window.scrollY;
      let heroHeight = 0;
      const measure = () => {
        heroHeight = document.querySelector<HTMLElement>("[data-hero]")?.offsetHeight ?? 0;
      };
      const apply = (next: HeaderState) => {
        if (next.solid !== state.solid) el.dataset.solid = String(next.solid);
        if (motion && next.hidden !== state.hidden) {
          gsap.to(el, { yPercent: next.hidden ? -100 : 0, duration: HEADER_DURATION, ease: "ui-in-out", overwrite: "auto" });
        }
        state = next;
      };
      const update = (y: number) => {
        apply(nextHeaderState({ y, lastY, menuOpen: menuOpenRef.current, focusInside: el.contains(document.activeElement), heroHeight }, state));
        lastY = y;
      };
      measure();
      update(window.scrollY);
      ScrollTrigger.create({ start: 0, end: "max", onRefresh: measure, onUpdate: (self) => update(self.scroll()) });
      // M11 "never hidden while focus is inside": the rule above only runs on scroll, so a Tab into a hidden header
      // would leave the focused control off-screen. Re-run it when focus enters.
      const onFocusIn = () => update(lastY);
      el.addEventListener("focusin", onFocusIn);
      return () => {
        el.removeEventListener("focusin", onFocusIn);
        // The hide/show tweens start in onUpdate, which ScrollTrigger does not run inside this context, so the revert
        // on a route change leaves them alone. Hand the next route the shown, transparent header its setup assumes.
        gsap.killTweensOf(el, "yPercent");
        if (motion) gsap.set(el, { yPercent: 0 });
        el.dataset.solid = "false";
      };
    },
    { scope: ref, dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <header
      ref={ref}
      data-site-header
      data-solid="false"
      {...(pathname === "/" ? { "data-hero-fade": "" } : {})}
      inert={menuOpen}
      className="site-header fixed inset-x-0 top-0 z-40"
    >
      <div className="flex items-center justify-between px-(--gutter) py-6 lg:py-12">
        <Link href="/" className="flex items-center gap-4" aria-label={`${firm.name}, home`}>
          <Monogram />
          <span className="flex flex-col gap-1">
            <span className="font-serif text-[17px] font-medium tracking-tight text-ink lg:text-[20px]">{firm.name}</span>
            <span className="hidden font-mono text-[10px] tracking-[0.18em] text-muted uppercase lg:block">{firm.designation}</span>
          </span>
        </Link>
        <div className="flex h-12 border border-line lg:h-16">
          <div className="hidden flex-col justify-center gap-1 border-r border-line px-6 font-mono text-[10px] tracking-[0.18em] text-muted uppercase lg:flex">
            <span>FRN {firm.frn}</span>
            <span>Est. {firm.established}</span>
          </div>
          <button
            ref={burgerRef}
            type="button"
            onClick={onOpen}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            // M12 burger → X: the lines morph (200 ms) while the overlay's wipe reaches them; its close button is the X.
            className={`burger grid w-12 place-items-center lg:w-16${menuOpen ? " is-close" : ""}`}
          >
            <span aria-hidden className="burger-lines" />
          </button>
        </div>
      </div>
    </header>
  );
}
