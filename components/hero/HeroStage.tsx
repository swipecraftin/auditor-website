"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { dur, stagger } from "@/lib/motion";
import { decideHeroTier, readTierEnv, type HeroTier } from "./tier";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

type Stage = { tier: HeroTier; capture: boolean };

// The headline intro (M1, PageMotion) starts when fonts are ready: 0.1 s delay, line reveal, one stagger step for line 2.
const INTRO_MS = (0.1 + dur.heroLines + stagger.editorial) * 1000;
const MOUNT_DELAY_MS = INTRO_MS + 400; // margin for a busy main thread

/**
 * The hero is decoration: if the renderer cannot start (context creation refused, context limit hit, chunk failed to
 * load), R3F rethrows the error to its parent. Catch it here so it degrades to the poster tier instead of unmounting
 * the route.
 */
class HeroErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function HeroStage() {
  const [stage, setStage] = useState<Stage | null>(null);

  useEffect(() => {
    const capture = new URLSearchParams(window.location.search).has("capture");
    if (capture) document.documentElement.classList.add("capture");
    const tier: HeroTier = capture ? "full" : decideHeroTier(readTierEnv());
    document.querySelector("[data-hero]")?.setAttribute("data-tier", tier);
    const mount = () => setStage({ tier, capture });

    // Loading three.js, creating the WebGL context and compiling the first shaders block the main thread. Start only
    // after the headline intro has finished (and the page is idle), so the 3D work can never delay or jank the headline
    // (spec M1 budget, LCP). The CSS backdrop holds the stage until the canvas fades in.
    let cancelled = false;
    let timer = 0;
    let idle = 0;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      timer = window.setTimeout(() => {
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(mount, { timeout: 1000 });
        else mount();
      }, MOUNT_DELAY_MS);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);

  const onCanvasError = useCallback(() => {
    const hero = document.querySelector("[data-hero]");
    hero?.setAttribute("data-tier", "poster");
    hero?.removeAttribute("data-hero-ready"); // in case the scene failed after its first frame
    setStage((s) => (s ? { ...s, tier: "poster" } : s));
  }, []);

  if (!stage || stage.tier === "poster") return null;
  return (
    <HeroErrorBoundary onError={onCanvasError}>
      <HeroCanvas tier={stage.tier} capture={stage.capture} />
    </HeroErrorBoundary>
  );
}
