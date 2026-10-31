export const ease = {
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
  editorial: "expo.out",
} as const;

/** Control points for GSAP CustomEase ids "ui-out" and "ui-in-out" (registered in lib/gsap.ts). */
export const easePoints = { out: "0.23,1,0.32,1", inOut: "0.77,0,0.175,1" } as const;

/** Seconds. */
export const dur = {
  press: 0.14,
  ui: 0.2,
  overlay: 0.5,
  overlayClose: 0.35,
  editorial: 0.9,
  lines: 1.1,
  heroLines: 0.95,
  heroFade: 0.8,
  bookOpen: 1.6,
  light: 1.2,
} as const;

/** Seconds between items. */
export const stagger = { ui: 0.04, editorial: 0.08, chars: 0.02, pages: 0.012, heroFade: 0.06 } as const;

/** Pixels. */
export const reveal = { y: 24, heroY: 12 } as const;
