import { site } from "@/content/site";

export function Practice() {
  const { practice } = site;
  return (
    <section id="practice" aria-labelledby="practice-title" className="section-y">
      <div className="shell">
        <h2 id="practice-title" data-reveal className="label-mono text-muted">{practice.label}</h2>
        <p data-split="words-scrub" className="mt-8 max-w-[22ch] font-serif text-statement text-ink">
          {practice.statement} <em className="italic text-brass">{practice.emphasis}</em>
        </p>
      </div>
    </section>
  );
}
