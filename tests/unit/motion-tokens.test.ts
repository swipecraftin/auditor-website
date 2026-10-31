import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dur, ease, easePoints, stagger } from "@/lib/motion";

const css = readFileSync("app/globals.css", "utf8");
const cssVar = (name: string) => css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
const ms = (s: number) => `${Math.round(s * 1000)}ms`;

describe("motion tokens", () => {
  it("CSS easing tokens mirror lib/motion.ts", () => {
    expect(cssVar("--ease-out")).toBe(ease.out);
    expect(cssVar("--ease-in-out")).toBe(ease.inOut);
  });
  it("CustomEase points match the cubic-bezier tokens", () => {
    expect(ease.out).toBe(`cubic-bezier(${easePoints.out.split(",").join(", ")})`);
    expect(ease.inOut).toBe(`cubic-bezier(${easePoints.inOut.split(",").join(", ")})`);
  });
  it("CSS duration tokens mirror lib/motion.ts", () => {
    expect(cssVar("--dur-press")).toBe(ms(dur.press));
    expect(cssVar("--dur-ui")).toBe(ms(dur.ui));
    expect(cssVar("--dur-overlay")).toBe(ms(dur.overlay));
  });
  it("UI micro-interactions stay under 300ms", () => {
    expect(dur.press).toBeLessThan(0.3);
    expect(dur.ui).toBeLessThan(0.3);
  });
  it("hero headline finishes within the 1.2s budget", () => {
    expect(0.1 + stagger.editorial + dur.heroLines).toBeLessThanOrEqual(1.2);
  });
});
