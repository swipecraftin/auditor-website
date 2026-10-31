"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";
import { Monogram } from "@/components/ui/Monogram";
import { site } from "@/content/site";

export type HeaderProps = {
  menuOpen: boolean;
  onOpen: () => void;
  burgerRef: RefObject<HTMLButtonElement | null>;
};

export function Header({ menuOpen, onOpen, burgerRef }: HeaderProps) {
  const pathname = usePathname();
  const { firm } = site;
  return (
    <header
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
            className="burger grid w-12 place-items-center lg:w-16"
          >
            <span aria-hidden className="burger-lines" />
          </button>
        </div>
      </div>
    </header>
  );
}
