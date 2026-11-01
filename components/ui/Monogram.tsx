import { site } from "@/content/site";

/** Type size for the fixed square tile: a four-character monogram ("VC&C") would run past its border at display size. */
export function monogramType(monogram: string): string {
  return monogram.length > 3 ? "text-[12px] lg:text-[14px]" : "text-[15px] lg:text-[18px]";
}

export function Monogram() {
  return (
    <span aria-hidden className={`grid size-10 shrink-0 place-items-center border border-ink font-serif ${monogramType(site.firm.monogram)} font-medium tracking-tight text-ink lg:size-12`}>
      {site.firm.monogram}
    </span>
  );
}
