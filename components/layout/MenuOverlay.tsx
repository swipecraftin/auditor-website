"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { Monogram } from "@/components/ui/Monogram";
import { site } from "@/content/site";

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
  const wasOpen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      wasOpen.current = true;
      el.querySelector<HTMLElement>("[data-menu-close]")?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      returnFocusTo.current?.focus();
    }
  }, [open, returnFocusTo]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>("a[href], button"));
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const tel = site.contact.phone.replace(/\s+/g, "");
  return (
    <div
      ref={ref}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      hidden={!open}
      onKeyDown={onKeyDown}
      className="menu-overlay fixed inset-0 z-50 flex flex-col bg-surface"
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
        <a href={`mailto:${site.contact.email}`} className="link-underline">{site.contact.email}</a>
      </div>
    </div>
  );
}
