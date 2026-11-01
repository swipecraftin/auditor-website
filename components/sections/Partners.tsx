import { site } from "@/content/site";

const initials = (name: string) =>
  name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

export function Partners() {
  return (
    <section id="partners" aria-labelledby="partners-title" className="section-y">
      <div className="shell">
        <h2 id="partners-title" data-reveal className="font-serif text-h2 text-ink">Partners</h2>
        {/* Four-up only from 1280 px: at 1024 px a four-up card is 158 px wide inside, too narrow for names like
            Lakshminarayanan Chandrasekhar. */}
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 xl:grid-cols-4">
          {site.partners.map((p, i) => (
            <li key={`${p.name}-${i}`} data-reveal className="partner-card border border-line p-6">
              <div data-reveal="scale" aria-hidden className="grid aspect-square place-items-center border border-line font-serif text-h2 text-muted">
                {initials(p.name)}
              </div>
              {/* 22 px fits an 18-letter name (Venkatasubramanian) whole down to 320 px and in a four-up card at 1280 px; one
                longer still breaks inside the card rather than spilling out of it. */}
              <p className="mt-6 font-serif text-[22px] leading-tight wrap-break-word text-ink">
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
