import { HeroPoster } from "@/components/hero/HeroPoster";
import { HeroStage } from "@/components/hero/HeroStage";
import { site } from "@/content/site";

export function Hero() {
  const { hero, contact } = site;
  return (
    <section id="top" data-hero aria-labelledby="hero-title" className="hero relative isolate overflow-hidden">
      <div aria-hidden className="hero-backdrop absolute inset-0 -z-30" />
      <HeroPoster />
      <HeroStage />
      {/* Over the 3D stage (canvas or poster), under the copy: keeps the copy legible where it meets the fan's crown. */}
      <div aria-hidden className="hero-scrim pointer-events-none absolute inset-0" />

      <div className="hero-copy absolute inset-x-0 top-32 px-(--gutter) text-center lg:top-40">
        <p data-hero-fade className="label-mono text-muted">{hero.eyebrow}</p>
        <h1 id="hero-title" data-split="intro" className="mt-6 font-serif text-h1 font-semibold text-ink">
          {hero.headline[0]}
          <br />
          {hero.headline[1]}
        </h1>
        <p data-hero-fade className="mx-auto mt-8 max-w-[44ch] text-body text-muted">{hero.sub}</p>
      </div>

      <a
        href="#contact"
        data-hero-fade
        className="hero-corner absolute inset-x-(--gutter) bottom-6 flex items-center justify-between gap-6 border border-line px-6 py-4 sm:right-(--gutter) sm:bottom-12 sm:left-auto"
      >
        <span className="flex flex-col gap-1">
          <span className="text-small font-semibold text-ink">Contact the partners</span>
          <span className="label-mono text-muted">{contact.phone}</span>
        </span>
        <span aria-hidden className="grid size-10 place-items-center border border-ink">→</span>
      </a>

      <div aria-hidden className="absolute bottom-12 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 label-mono text-muted lg:flex">
        <span className="h-8 w-px bg-linear-to-b from-ink to-transparent" />
        Scroll
      </div>
    </section>
  );
}
