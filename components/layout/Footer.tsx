import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  const { firm, disclaimer } = site;
  return (
    <footer className="border-t border-line">
      <div className="shell section-y">
        <div className="grid gap-8 lg:grid-cols-2">
          <p className="max-w-[60ch] text-small text-muted">{disclaimer.short}</p>
          <nav aria-label="Footer" className="flex gap-6 lg:justify-end">
            <Link href="/disclaimer" className="link-underline label-mono text-muted">Disclaimer</Link>
            <Link href="/#contact" className="link-underline label-mono text-muted">Contact</Link>
          </nav>
        </div>
        <p data-split="chars" aria-hidden className="mt-16 font-serif text-wordmark font-medium break-words text-ink">{firm.name}</p>
        <p className="mt-8 label-mono text-muted">
          © {new Date().getFullYear()} {firm.name} · {firm.designation} · FRN {firm.frn}
        </p>
      </div>
    </footer>
  );
}
