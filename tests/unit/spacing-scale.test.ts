import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ALLOWED = new Set(["0", "px", "1", "2", "3", "4", "6", "8", "12", "16", "24", "32", "auto"]);
const ALLOWED_PX = new Set([0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]);
const CLASS_RE =
  /(?<![\w-])((?:[\w-]+:)*)-?(px|py|pt|pr|pb|pl|ps|pe|p|mx|my|mt|mr|mb|ml|ms|me|m|gap-x|gap-y|gap|space-x|space-y|scroll-mt|scroll-pt)-([^\s"'`}]+)/g;
const isAllowed = (v: string) => ALLOWED.has(v) || /^\(--[\w-]+\)$/.test(v);

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

describe("spacing scale", () => {
  it("detects off-scale classes", () => {
    const sample = `className="p-[13px] lg:mt-5 px-6 py-(--gutter) gap-px"`;
    const hits = [...sample.matchAll(CLASS_RE)].map((m) => m[3]).filter((v) => !isAllowed(v));
    expect(hits).toEqual(["[13px]", "5"]);
  });

  it("parses gap-x / gap-y as their own properties, not as gap with value x-4", () => {
    const ok = `className="gap-x-4 gap-y-6 md:gap-x-8 lg:gap-y-12"`;
    expect([...ok.matchAll(CLASS_RE)].map((m) => m[3]).filter((v) => !isAllowed(v))).toEqual([]);
    const bad = `className="gap-x-5 md:gap-y-[7px]"`;
    expect([...bad.matchAll(CLASS_RE)].map((m) => m[3]).filter((v) => !isAllowed(v))).toEqual(["5", "[7px]"]);
  });

  it("components use only scale values for padding, margin and gap", () => {
    const found = [...files("app"), ...files("components")];
    expect(found.length).toBeGreaterThan(0);
    const bad = found.flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(CLASS_RE)].filter((m) => !isAllowed(m[3])).map((m) => `${f}: ${m[0]}`),
    );
    expect(bad).toEqual([]);
  });

  it("globals.css uses only scale values for padding, margin and gap", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const bad = [...css.matchAll(/(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z-]+)?\s*:\s*([^;]+);/g)].filter(
      (m) => [...m[1].matchAll(/(-?\d+(?:\.\d+)?)px/g)].some((n) => !ALLOWED_PX.has(Math.abs(Number(n[1])))),
    );
    expect(bad.map((m) => m[0])).toEqual([]);
  });

  it("--gutter is only ever 24px, 48px or 64px, and all three are defined", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const values = [...css.matchAll(/--gutter:\s*([^;}]+)/g)].map((m) => m[1].trim());
    expect([...new Set(values)].sort()).toEqual(["24px", "48px", "64px"]);
  });
});
