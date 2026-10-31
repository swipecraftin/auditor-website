import { site } from "@/content/site";

export function Facts() {
  return (
    <section aria-label="Firm facts" className="border-y border-line">
      <div className="shell">
        <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
          {site.facts.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse gap-3 bg-bg py-6 sm:py-8 sm:pr-6 sm:even:pl-6 xl:py-12 xl:pl-8 xl:even:pl-8 xl:first:pl-0">
              <dt className="label-mono text-muted">{fact.label}</dt>
              <dd data-split="lines" className="font-serif text-fact font-medium text-ink tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
