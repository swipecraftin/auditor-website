export type HeaderInput = { y: number; lastY: number; menuOpen: boolean; focusInside: boolean; heroHeight: number };
export type HeaderState = { hidden: boolean; solid: boolean };

export const HIDE_AFTER = 120;
export const JITTER = 4;
export const HEADER_DURATION = 0.3;

/** M11 — decide header visibility and background from the scroll position. */
export function nextHeaderState(input: HeaderInput, prev: HeaderState): HeaderState {
  const solid = input.y > Math.max(0, input.heroHeight - 96);
  if (input.menuOpen || input.focusInside || input.y < HIDE_AFTER) return { hidden: false, solid };
  const delta = input.y - input.lastY;
  if (Math.abs(delta) < JITTER) return { hidden: prev.hidden, solid };
  return { hidden: delta > 0, solid };
}
