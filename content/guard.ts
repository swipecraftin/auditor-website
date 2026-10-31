export type Violation = { path: string; rule: string; text: string };

const BANNED: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bbest\b/i, "superlative: best"],
  [/\bleading\b/i, "superlative: leading"],
  [/\bno\.?\s?1\b/i, "superlative: No. 1"],
  [/\bnumber one\b/i, "superlative: number one"],
  [/\btop\b/i, "superlative: top"],
  [/\bmost trusted\b/i, "superlative: most trusted"],
  [/\bcheapest\b/i, "superlative: cheapest"],
  [/\bfree\b/i, "offer: free"],
  [/\bguarantee(d|s)?\b/i, "claim: guarantee"],
  [/(₹|\brs\.?)\s?\d/i, "price"],
];

const FORBIDDEN_KEYS = ["testimonials", "reviews", "ratings", "clients", "fees", "pricing", "prices"];

/** ICAI guard: returns every banned phrase, price or forbidden field found in `value`. */
export function findIcaiViolations(value: unknown, path = "site"): Violation[] {
  if (typeof value === "string") {
    return BANNED.filter(([re]) => re.test(value)).map(([, rule]) => ({ path, rule, text: value }));
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findIcaiViolations(item, `${path}[${i}]`));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => [
      ...(FORBIDDEN_KEYS.includes(key.toLowerCase())
        ? [{ path: `${path}.${key}`, rule: `forbidden field: ${key}`, text: "" }]
        : []),
      ...findIcaiViolations(item, `${path}.${key}`),
    ]);
  }
  return [];
}
