import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Disclaimer", description: site.disclaimer.short };

export default function DisclaimerPage() {
  return (
    <main id="main" className="pt-32">
      <div className="shell section-y">
        <p className="label-mono text-muted">{site.firm.name}</p>
        <h1 data-split="lines" className="mt-6 font-serif text-h2 text-ink">Disclaimer</h1>
        <div className="mt-12 max-w-[65ch] space-y-6 text-body text-muted">
          {site.disclaimer.full.map((paragraph) => (
            <p key={paragraph} data-reveal>{paragraph}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
