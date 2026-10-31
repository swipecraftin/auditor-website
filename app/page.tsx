import { site } from "@/content/site";

export default function Home() {
  return (
    <main id="main" className="shell section-y">
      <p className="label-mono text-muted">{site.hero.eyebrow}</p>
      <h1 className="mt-6 font-serif text-h1 text-ink">{site.hero.headline.join(" ")}</h1>
    </main>
  );
}
