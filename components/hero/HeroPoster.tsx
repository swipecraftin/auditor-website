const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const REDUCED = "(prefers-reduced-motion: reduce)";
/**
 * The live scene picks its portrait camera when the hero box is taller than wide. The hero is 100vw ×
 * clamp(640px, 100svh, 1000px) (`.hero` in globals.css), so that is: always below 640 px wide, and in a portrait viewport
 * below 1000 px wide. A wider portrait viewport (an iPad Pro, a portrait monitor) has a capped, landscape hero.
 * `max-width: 639.98px` rather than `width < 640px`: <source media> is not down-levelled like the CSS, and Safari < 16.4
 * does not know range syntax.
 */
const PORTRAIT_HERO = ["(max-width: 639.98px)", "(orientation: portrait) and (max-width: 999.98px)"];

/**
 * Art-directed static hero. Server-rendered copy: only reduced-motion visitors download an image
 * (everyone else gets a transparent pixel, so live-3D visitors pay nothing). `force` is used by the
 * client for the low-end "poster" tier. Decorative, so it never takes pointer events (no long-press
 * "Save Image" callout on touch, which the canvas tier never shows either).
 *
 * Each poster is rendered at the widest hero it serves (scripts/render-poster.mjs), so `object-cover` only trims its
 * sides: with the live camera's fixed vertical fov that is exactly the live frame. Past that width (ultrawide) it is
 * anchored to the bottom, where the book stands, and loses dark stage at the top instead.
 */
export function HeroPoster({ force = false }: { force?: boolean }) {
  // Every comma-separated clause carries the reduced-motion condition, or live-3D visitors would download the poster.
  const media = (clauses = [""]) =>
    clauses.map((clause) => [force ? "" : REDUCED, clause].filter(Boolean).join(" and ")).join(", ") || undefined;
  return (
    <picture className={`hero-poster pointer-events-none absolute inset-0 -z-20${force ? " hero-poster-forced" : ""}`}>
      <source media={media(PORTRAIT_HERO)} srcSet="/hero/ledger-poster-portrait.avif" type="image/avif" />
      <source media={media(PORTRAIT_HERO)} srcSet="/hero/ledger-poster-portrait.webp" type="image/webp" />
      <source media={media()} srcSet="/hero/ledger-poster.avif" type="image/avif" />
      <source media={media()} srcSet="/hero/ledger-poster.webp" type="image/webp" />
      <img
        src={force ? "/hero/ledger-poster.webp" : TRANSPARENT_PIXEL}
        alt=""
        decoding="async"
        className="size-full object-cover object-bottom"
      />
    </picture>
  );
}
