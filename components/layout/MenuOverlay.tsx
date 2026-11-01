"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { isMotionOk } from "@/components/motion/motion-env";
import { useLenis } from "@/components/motion/MotionProvider";
import { Monogram } from "@/components/ui/Monogram";
import { site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { dur, stagger } from "@/lib/motion";

export const MENU_LINKS = [
  { href: "/#practice", label: "Practice" },
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "How we work" },
  { href: "/#partners", label: "Partners" },
  { href: "/#contact", label: "Contact" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

export type MenuOverlayProps = {
  open: boolean;
  onClose: () => void;
  returnFocusTo: RefObject<HTMLButtonElement | null>;
};

export function MenuOverlay({ open, onClose, returnFocusTo }: MenuOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const wasOpen = useRef(false);
  const lenis = useLenis();

  // M12 — wipe down, then the items rise in; closing plays it backwards. Built only when motion is allowed:
  // without it the effect below toggles the open state directly (globals.css holds the closed state).
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !isMotionOk()) return;
      gsap.set(el, { visibility: "hidden", clipPath: "inset(0% 0% 100% 0%)" });
      timeline.current = gsap
        .timeline({ paused: true, onReverseComplete: () => void gsap.set(el, { visibility: "hidden" }) })
        .to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: dur.overlay, ease: "ui-in-out" })
        .from(el.querySelectorAll("[data-menu-item]"), { y: 24, opacity: 0, duration: 0.6, ease: "expo.out", stagger: stagger.ui }, 0.15);
      return () => {
        timeline.current = null;
      };
    },
    { scope: ref },
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tl = timeline.current;
    if (open) {
      wasOpen.current = true;
      if (tl) {
        gsap.set(el, { visibility: "visible" });
        tl.timeScale(1).play();
      } else {
        gsap.set(el, { visibility: "visible", clipPath: "none" });
      }
      el.querySelector<HTMLElement>("[data-menu-close]")?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (!tl) {
        gsap.set(el, { clearProps: "visibility,clipPath" });
      } else if (tl.time() === 0) {
        // Closed before the wipe drew a frame (fast double press, busy first load): a reverse from time 0 never fires
        // onReverseComplete, which would leave the overlay `visible`, so stop the pending play and hide it directly.
        tl.pause(0);
        gsap.set(el, { visibility: "hidden" });
      } else {
        tl.timeScale(tl.duration() / dur.overlayClose).reverse();
      }
      // Synchronously, never in a GSAP callback: after a same-page hash link, MotionProvider focuses the target section
      // in a setTimeout(0), and that must land after (and so win over) this.
      returnFocusTo.current?.focus();
    }
  }, [open, returnFocusTo]);

  // R18 — the page behind the open menu must not scroll. With Lenis: stop it (it cancels wheel/touch and clips the root).
  // Without Lenis (reduced motion): hide the root's overflow — `hidden`, not `clip`, so hash navigation can still scroll.
  useEffect(() => {
    if (!open) return;
    if (lenis) {
      lenis.stop();
      return () => lenis.start();
    }
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open, lenis]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    const el = ref.current;
    if (event.key !== "Tab" || !el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("a[href], button"));
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    // Focus on the dialog itself (blank-area click) or outside it: pull it back in.
    if (active === el || !el.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const tel = site.contact.phone.replace(/\s+/g, "");
  return (
    // inert while closed: during the 350 ms reverse the overlay is still painted, but nothing in it can take focus or clicks.
    <div
      ref={ref}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      tabIndex={-1}
      inert={!open}
      onKeyDown={onKeyDown}
      className="menu-overlay fixed inset-0 z-50 flex flex-col bg-surface outline-none"
    >
      <div className="flex items-center justify-between px-(--gutter) py-6 lg:py-12">
        <span className="flex items-center gap-4">
          <Monogram />
          <span className="font-serif text-[17px] font-medium text-ink lg:text-[20px]">{site.firm.name}</span>
        </span>
        <button
          type="button"
          data-menu-close
          onClick={onClose}
          aria-label="Close menu"
          className="burger is-close grid size-12 place-items-center border border-line lg:size-16"
        >
          <span aria-hidden className="burger-lines" />
        </button>
      </div>
      <nav aria-label="Primary" className="shell flex flex-1 flex-col justify-center">
        <ul className="space-y-2">
          {MENU_LINKS.map((link) => (
            <li key={link.href} data-menu-item>
              <Link href={link.href} onClick={onClose} className="inline-block font-serif text-h2 text-ink">{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div data-menu-item className="shell flex flex-wrap gap-x-8 gap-y-2 pb-12 label-mono text-muted">
        <a href={`tel:${tel}`} className="link-underline">{site.contact.phone}</a>
        <a href={`mailto:${site.contact.email}`} className="link-underline wrap-anywhere">{site.contact.email}</a>
      </div>
    </div>
  );
}
