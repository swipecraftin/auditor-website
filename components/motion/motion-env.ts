/** True when the boot script allowed motion (no reduced-motion preference) and JS is running. */
export function isMotionOk(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("motion-ok");
}
