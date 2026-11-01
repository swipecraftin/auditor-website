import { describe, expect, it } from "vitest";
import { BREATH, CLOSED_ANGLE, OPEN_ANGLE, PAGE_COUNT, pageAngle, restAngle } from "@/components/hero/ledger-math";

describe("restAngle", () => {
  it("spans from the right cover to the left cover", () => {
    expect(restAngle(0)).toBeCloseTo(CLOSED_ANGLE);
    expect(restAngle(PAGE_COUNT - 1)).toBeCloseTo(OPEN_ANGLE);
  });
  it("increases page by page", () => {
    for (let i = 1; i < PAGE_COUNT; i++) expect(restAngle(i)).toBeGreaterThan(restAngle(i - 1));
  });
});

describe("pageAngle", () => {
  it("keeps pages closed before the intro", () => {
    expect(pageAngle(restAngle(20), 0, 0, 3, 20)).toBeCloseTo(CLOSED_ANGLE);
  });
  it("reaches the rest angle when fully open (t = 0, i = 0 → no breathing)", () => {
    expect(pageAngle(restAngle(10), 1, 0, 0, 0)).toBeCloseTo(restAngle(10));
  });
  it("folds 30 % toward closed at full hero scroll", () => {
    const rest = restAngle(30);
    expect(pageAngle(rest, 1, 1, 0, 0)).toBeCloseTo(rest + (CLOSED_ANGLE - rest) * 0.3);
  });
  it("breathes by at most BREATH radians", () => {
    const rest = restAngle(30);
    for (let t = 0; t < 10; t += 0.37) {
      expect(Math.abs(pageAngle(rest, 1, 0, t, 30) - rest)).toBeLessThanOrEqual(BREATH + 1e-9);
    }
  });
});
