import { describe, expect, it } from "vitest";
import { findIcaiViolations } from "@/content/guard";
import { site } from "@/content/site";

describe("findIcaiViolations", () => {
  it("passes the real site content", () => {
    expect(findIcaiViolations(site)).toEqual([]);
  });

  it.each([
    ["The best CA firm in town", "superlative: best"],
    ["A leading practice", "superlative: leading"],
    ["Ranked No. 1", "superlative: No. 1"],
    ["Top auditors", "superlative: top"],
    ["Free consultation", "offer: free"],
    ["Returns from ₹999", "price"],
    ["Filing at Rs. 500", "price"],
  ])("flags %s", (text, rule) => {
    expect(findIcaiViolations({ copy: text })).toEqual([{ path: "site.copy", rule, text }]);
  });

  it("flags forbidden fields", () => {
    expect(findIcaiViolations({ testimonials: [] })).toEqual([
      { path: "site.testimonials", rule: "forbidden field: testimonials", text: "" },
    ]);
  });

  it("ignores words that only contain a banned word", () => {
    expect(findIcaiViolations({ a: "Desktop stop freedom" })).toEqual([]);
  });
});
