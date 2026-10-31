import { site } from "@/content/site";

export function Facts() {
  return (
    <section aria-label="Firm facts" className="border-y border-line">
      <div className="shell">
        <dl className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
          {site.facts.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse gap-3 bg-bg py-8 pr-6 even:pl-6 lg:py-12 lg:pl-8 lg:first:pl-0">
              <dt className="label-mono text-muted">{fact.label}</dt>
              <dd data-split="lines" className="font-serif text-fact font-medium text-ink tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
