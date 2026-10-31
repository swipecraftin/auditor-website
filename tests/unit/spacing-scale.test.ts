import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ALLOWED = new Set(["0", "px", "1", "2", "3", "4", "6", "8", "12", "16", "24", "32", "auto"]);
const ALLOWED_PX = new Set([0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]);
const CLASS_RE =
  /(?<![\w-])((?:[\w-]+:)*)-?(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|scroll-mt|scroll-pt)-([^\s"'`}]+)/g;
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

  it("components use only scale values for padding, margin and gap", () => {
    const bad = [...files("app"), ...files("components")].flatMap((f) =>
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
});
