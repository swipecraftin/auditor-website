import { site } from "@/content/site";

const initials = (name: string) =>
  name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

export function Partners() {
  return (
    <section id="partners" aria-labelledby="partners-title" className="section-y">
      <div className="shell">
        <h2 id="partners-title" data-reveal className="font-serif text-h2 text-ink">Partners</h2>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {site.partners.map((p, i) => (
            <li key={`${p.name}-${i}`} data-reveal className="partner-card border border-line p-6">
              <div data-reveal="scale" aria-hidden className="grid aspect-square place-items-center border border-line font-serif text-h2 text-muted">
                {initials(p.name)}
              </div>
              <p className="mt-6 font-serif text-[24px] leading-tight text-ink">
                <span className="partner-name">{p.name}</span>
              </p>
              <p className="mt-2 label-mono text-brass">{p.credential}</p>
              <p className="mt-1 text-small text-muted">{p.focus}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
