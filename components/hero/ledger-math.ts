export const PAGE_COUNT = 46;
export const CLOSED_ANGLE = 0.06;
export const OPEN_ANGLE = Math.PI - 0.06;
export const FOLD_ON_SCROLL = 0.3;
export const BREATH = 0.012;

/** Rest angle (radians around the spine) of page i: clustered toward the covers, fanned in the middle. */
export function restAngle(i: number, count = PAGE_COUNT): number {
  const t = i / (count - 1);
  const eased = 0.5 - Math.cos(t * Math.PI) / 2;
  return CLOSED_ANGLE + (OPEN_ANGLE - CLOSED_ANGLE) * (eased * 0.55 + t * 0.45);
}

/** Page angle for intro progress `open` (0 → 1), hero scroll progress `scroll` (0 → 1) and time `t` in seconds. */
export function pageAngle(rest: number, open: number, scroll: number, t: number, i: number): number {
  const opened = CLOSED_ANGLE + (rest - CLOSED_ANGLE) * open;
  const folded = opened + (CLOSED_ANGLE - opened) * FOLD_ON_SCROLL * scroll;
  return folded + Math.sin(t * 0.6 + i * 0.41) * BREATH * open;
}
