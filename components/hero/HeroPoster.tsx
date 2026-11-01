const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Art-directed static hero. Server-rendered copy: only reduced-motion visitors download an image
 * (everyone else gets a transparent pixel, so live-3D visitors pay nothing). `force` is used by the
 * client for the low-end "poster" tier. Decorative, so it never takes pointer events (no long-press
 * "Save Image" callout on touch, which the canvas tier never shows either).
 */
export function HeroPoster({ force = false }: { force?: boolean }) {
  const media = (extra?: string) => [force ? undefined : REDUCED, extra].filter(Boolean).join(" and ") || undefined;
  return (
    <picture className={`hero-poster pointer-events-none absolute inset-0 -z-20${force ? " hero-poster-forced" : ""}`}>
      <source media={media("(orientation: portrait)")} srcSet="/hero/ledger-poster-portrait.avif" type="image/avif" />
      <source media={media("(orientation: portrait)")} srcSet="/hero/ledger-poster-portrait.webp" type="image/webp" />
      <source media={media()} srcSet="/hero/ledger-poster.avif" type="image/avif" />
      <source media={media()} srcSet="/hero/ledger-poster.webp" type="image/webp" />
      <img src={force ? "/hero/ledger-poster.webp" : TRANSPARENT_PIXEL} alt="" decoding="async" className="size-full object-cover" />
    </picture>
  );
}
