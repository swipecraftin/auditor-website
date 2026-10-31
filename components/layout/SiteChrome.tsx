"use client";

import { useCallback, useRef, useState } from "react";
import { Header } from "./Header";
import { MenuOverlay } from "./MenuOverlay";

export function SiteChrome() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  return (
    <>
      <Header menuOpen={open} onOpen={openMenu} burgerRef={burgerRef} />
      <MenuOverlay open={open} onClose={closeMenu} returnFocusTo={burgerRef} />
    </>
  );
}
