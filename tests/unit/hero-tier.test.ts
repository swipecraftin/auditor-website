import { describe, expect, it } from "vitest";
import { decideHeroTier, type TierEnv } from "@/components/hero/tier";

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
