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

/**
 * three r163+ renders with WebGL2 only (a WebGL1 context makes WebGLRenderer throw), so a WebGL1-only device counts as
 * "no WebGL" here and gets the poster tier (spec §6).
 */
export function probeWebGL2(createCanvas: () => Pick<HTMLCanvasElement, "getContext">): boolean {
  try {
    const gl = createCanvas().getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

/** Browser-only: reads the environment for decideHeroTier. */
export function readTierEnv(): TierEnv {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const webgl = probeWebGL2(() => document.createElement("canvas"));
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl,
    deviceMemory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    finePointer: window.matchMedia("(pointer: fine)").matches,
    width: window.innerWidth,
  };
}
