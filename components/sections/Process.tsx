import { site } from "@/content/site";

export function Process() {
  return (
    <section id="process" data-process aria-labelledby="process-title" className="section-y">
      <div className="shell">
        <h2 id="process-title" data-reveal className="font-serif text-h2 text-ink">How we work</h2>
        <div aria-hidden className="mt-16 hidden h-px bg-line lg:block">
          <span data-process-progress className="block h-px origin-left bg-brass" />
        </div>
        <ol className="mt-12 grid gap-12 lg:mt-8 lg:grid-cols-4 lg:gap-6">
          {site.process.map((step) => (
            <li key={step.n} data-step>
              <span className="label-mono text-brass">{step.n}</span>
              <h3 className="mt-4 font-serif text-h3 font-medium text-ink">{step.title}</h3>
              <p data-step-body className="mt-3 max-w-[32ch] text-body text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
