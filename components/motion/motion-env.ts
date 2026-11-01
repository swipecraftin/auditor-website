/** True when the boot script allowed motion (no reduced-motion preference) and JS is running. */
export function isMotionOk(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("motion-ok");
}

let jumping = false;

/**
 * Runs a programmatic jump: landing on a page (or its hash target) after a route change. Scroll updates that fire inside
 * it (ScrollTrigger and Lenis both notify synchronously) are a change of place, not a scroll gesture, so they carry no
 * direction: the header must not read a landing 2000 px down the page as "scrolling down" and hide.
 */
export function jump(fn: () => void): void {
  jumping = true;
  try {
    fn();
  } finally {
    jumping = false;
  }
}

export function isJumping(): boolean {
  return jumping;
}
