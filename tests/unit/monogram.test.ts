import { describe, expect, it } from "vitest";
import { monogramType } from "@/components/ui/Monogram";

// break-ui: the monogram tile is a fixed square (40 px, 48 px from lg). Three characters ("F&C") fit at 15 / 18 px; a
// four-character monogram ("VC&C") ran 3–4 px past the tile's border, so it steps the type down instead.
describe("monogramType", () => {
  it("keeps the display size for up to three characters", () => {
    expect(monogramType("F&C")).toBe("text-[15px] lg:text-[18px]");
    expect(monogramType("AB")).toBe("text-[15px] lg:text-[18px]");
  });
  it("steps down for four or more", () => {
    expect(monogramType("VC&C")).toBe("text-[12px] lg:text-[14px]");
  });
});
