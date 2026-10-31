import { site } from "@/content/site";

export function JsonLd() {
  const { firm, contact } = site;
  const data = {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    name: firm.name,
    url: firm.url,
    telephone: contact.phone,
    email: contact.email,
    foundingDate: String(firm.established),
    address: { "@type": "PostalAddress", streetAddress: contact.address.join(", "), addressLocality: firm.city, addressCountry: "IN" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
