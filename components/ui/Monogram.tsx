import { site } from "@/content/site";

export function Monogram() {
  return (
    <span aria-hidden className="grid size-10 place-items-center border border-ink font-serif text-[15px] font-medium tracking-tight text-ink lg:size-12 lg:text-[18px]">
      {site.firm.monogram}
    </span>
  );
}
