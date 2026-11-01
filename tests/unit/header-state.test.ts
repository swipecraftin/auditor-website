import { describe, expect, it } from "vitest";
import { nextHeaderState, type HeaderInput } from "@/components/layout/header-state";

const base: HeaderInput = { y: 0, lastY: 0, menuOpen: false, focusInside: false, heroHeight: 900 };
const shown = { hidden: false, solid: false };

describe("nextHeaderState", () => {
  it("stays visible near the top", () => {
    expect(nextHeaderState({ ...base, y: 100, lastY: 50 }, shown)).toEqual({ hidden: false, solid: false });
  });
  it("hides when scrolling down past 120px", () => {
    expect(nextHeaderState({ ...base, y: 400, lastY: 300 }, shown).hidden).toBe(true);
  });
  it("shows again when scrolling up", () => {
    expect(nextHeaderState({ ...base, y: 300, lastY: 400 }, { hidden: true, solid: false }).hidden).toBe(false);
  });
  it("ignores jitter smaller than 4px", () => {
    expect(nextHeaderState({ ...base, y: 402, lastY: 400 }, { hidden: true, solid: false }).hidden).toBe(true);
  });
  it("never hides while the menu is open", () => {
    expect(nextHeaderState({ ...base, y: 800, lastY: 500, menuOpen: true }, shown).hidden).toBe(false);
  });
  it("never hides while focus is inside the header", () => {
    expect(nextHeaderState({ ...base, y: 800, lastY: 500, focusInside: true }, shown).hidden).toBe(false);
  });
  it("turns solid once the hero has scrolled past", () => {
    expect(nextHeaderState({ ...base, y: 820, lastY: 800 }, shown).solid).toBe(true);
    expect(nextHeaderState({ ...base, y: 700, lastY: 690 }, shown).solid).toBe(false);
  });
  it("turns solid on pages without a hero as soon as they scroll", () => {
    expect(nextHeaderState({ ...base, heroHeight: 0, y: 10, lastY: 0 }, shown).solid).toBe(true);
  });
});
