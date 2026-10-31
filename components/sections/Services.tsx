import { site } from "@/content/site";

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="section-y">
      <div className="shell">
        <div className="flex items-baseline justify-between">
          <h2 id="services-title" data-reveal className="label-mono text-muted">Services</h2>
          <span aria-hidden className="label-mono text-muted">{String(site.services.length).padStart(2, "0")}</span>
        </div>
        <ul className="mt-8">
          {site.services.map((s) => (
            <li key={s.n}>
              <span data-line aria-hidden className="block h-px bg-line" />
              <a
                href="#contact"
                data-reveal
                className="svc-row grid grid-cols-[48px_1fr_24px] items-baseline gap-x-4 gap-y-2 py-6 lg:grid-cols-[96px_1fr_1.2fr_40px] lg:gap-x-6 lg:py-8"
              >
                <span className="label-mono text-muted">{s.n}</span>
                <h3 className="svc-title font-serif text-h3 font-medium text-ink">{s.title}</h3>
                <span aria-hidden className="svc-arrow col-start-3 row-start-1 justify-self-end text-muted lg:col-start-4">→</span>
                <p className="svc-summary col-start-2 text-body text-muted lg:col-start-3 lg:row-start-1">{s.summary}</p>
                <span className="sr-only"> — contact the partners about {s.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <span data-line aria-hidden className="block h-px bg-line" />
      </div>
    </section>
  );
}
