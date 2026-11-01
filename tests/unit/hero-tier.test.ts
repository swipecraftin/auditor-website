import { describe, expect, it } from "vitest";
import { decideHeroTier, probeWebGL2, type TierEnv } from "@/components/hero/tier";

const capable: TierEnv = { reducedMotion: false, webgl: true, deviceMemory: 8, saveData: false, finePointer: true, width: 1440 };

describe("decideHeroTier", () => {
  it.each<[string, TierEnv, string]>([
    ["desktop", capable, "full"],
    ["narrow desktop window", { ...capable, width: 900 }, "lite"],
    ["phone", { ...capable, finePointer: false, width: 390, deviceMemory: 4 }, "lite"],
    ["unknown memory", { ...capable, deviceMemory: undefined }, "full"],
    ["reduced motion", { ...capable, reducedMotion: true }, "poster"],
    ["no WebGL", { ...capable, webgl: false }, "poster"],
    ["data saver", { ...capable, saveData: true }, "poster"],
    ["2 GB device", { ...capable, deviceMemory: 2 }, "poster"],
  ])("%s", (_name, env, expected) => {
    expect(decideHeroTier(env)).toBe(expected);
  });
});

describe("probeWebGL2", () => {
  type Ctx = { getExtension: (name: string) => { loseContext: () => void } | null };
  const canvas = (contexts: Record<string, Ctx | null>) => () =>
    ({ getContext: (type: string) => contexts[type] ?? null }) as unknown as Pick<HTMLCanvasElement, "getContext">;
  const ctx = (): Ctx => ({ getExtension: () => ({ loseContext: () => {} }) });

  it("accepts a WebGL2 context", () => {
    expect(probeWebGL2(canvas({ webgl2: ctx() }))).toBe(true);
  });
  it("rejects a WebGL1-only device (three r163+ throws on WebGL1)", () => {
    expect(probeWebGL2(canvas({ webgl: ctx() }))).toBe(false);
  });
  it("rejects a browser whose getContext throws", () => {
    expect(
      probeWebGL2(() => {
        throw new Error("blocked");
      }),
    ).toBe(false);
  });
});
