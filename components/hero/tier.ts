export type HeroTier = "poster" | "full" | "lite";

export type TierEnv = {
  reducedMotion: boolean;
  webgl: boolean;
  deviceMemory?: number;
  saveData?: boolean;
  finePointer: boolean;
  width: number;
};

/** Spec §6 tiers (memory threshold per plan "Resolved spec conflicts" #3). */
export function decideHeroTier(env: TierEnv): HeroTier {
  const lowEnd = env.saveData === true || (env.deviceMemory !== undefined && env.deviceMemory <= 2);
  if (env.reducedMotion || !env.webgl || lowEnd) return "poster";
  return env.finePointer && env.width >= 1024 ? "full" : "lite";
}

/** Browser-only: reads the environment for decideHeroTier. */
export function readTierEnv(): TierEnv {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webgl = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl,
    deviceMemory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    finePointer: window.matchMedia("(pointer: fine)").matches,
    width: window.innerWidth,
  };
}
