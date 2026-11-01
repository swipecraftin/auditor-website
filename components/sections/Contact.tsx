import { CopyEmail } from "@/components/ui/CopyEmail";
import { site } from "@/content/site";

export function Contact() {
  const { contact } = site;
  const tel = contact.phone.replace(/\s+/g, "");
  return (
    <section id="contact" aria-labelledby="contact-title" className="section-y border-t border-line">
      <div className="shell">
        <h2 id="contact-title" data-split="lines" className="max-w-[14ch] font-serif text-h2 text-ink">Contact the partners</h2>
        {/* Three columns from 1024 px. At tablet width a third (192 px) is narrower than the call button, which broke the
            phone number in two; two columns there, Hours below. */}
        <div className="mt-12 grid gap-12 md:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          <div data-reveal>
            <h3 className="label-mono text-muted">Visit</h3>
            <address className="mt-4 text-body not-italic text-ink">
              {contact.address.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
            </address>
            <a href={contact.mapUrl} target="_blank" rel="noreferrer" className="link-underline mt-4 inline-block text-small text-muted">
              Open in Maps ↗
            </a>
          </div>
          <div data-reveal>
            <h3 className="label-mono text-muted">Call &amp; write</h3>
            {/* data-magnetic sits on a wrapper so the magnetic transform never overrides .btn:active */}
            <span data-magnetic className="mt-4 inline-block">
              <a href={`tel:${tel}`} className="btn inline-flex items-center gap-3 border border-ink px-6 py-4 whitespace-nowrap text-ink">
                {contact.phone} <span aria-hidden className="arrow-nudge">→</span>
              </a>
            </span>
            <CopyEmail email={contact.email} className="mt-6" />
          </div>
          <div data-reveal>
            <h3 className="label-mono text-muted">Hours</h3>
            <p className="mt-4 text-body text-ink">{contact.hours}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
