// Every value in this file is a placeholder — see content/PLACEHOLDERS.md.
export const site = {
  firm: {
    name: "Firm Name & Co.",
    monogram: "F&C",
    designation: "Chartered Accountants",
    frn: "000000S",
    established: 1998,
    city: "Hyderabad",
    url: "https://www.firmname.in",
  },
  hero: {
    eyebrow: "Audit · Tax · Advisory",
    headline: ["Clarity,", "line by line."],
    sub: "Audit, taxation and advisory for owner-led businesses, families and institutions, from our office in Hyderabad.",
  },
  facts: [
    { value: "1998", label: "Established" },
    { value: "4", label: "Partners" },
    { value: "2", label: "Offices" },
    { value: "000000S", label: "ICAI firm registration" },
  ],
  practice: {
    label: "The practice",
    statement: "We read every line, so the people who depend on your numbers",
    emphasis: "can read them plainly.",
  },
  services: [
    { n: "01", title: "Audit & Assurance", summary: "Statutory, internal and tax audits." },
    { n: "02", title: "Direct Tax", summary: "Returns, assessments, representation and planning." },
    { n: "03", title: "GST", summary: "Registration, returns, reconciliations and proceedings." },
    { n: "04", title: "Company Law & ROC", summary: "Incorporation, annual filings and secretarial compliance." },
    { n: "05", title: "Advisory", summary: "Structuring, valuations and transaction support." },
  ],
  process: [
    { n: "01", title: "Understand", body: "We learn the business, its records and its obligations before we test anything." },
    { n: "02", title: "Examine", body: "Fieldwork and testing, line by line, with questions raised as they arise." },
    { n: "03", title: "Report", body: "Findings, opinions and filings, written plainly and delivered on time." },
    { n: "04", title: "Advise", body: "What the numbers mean for the next decision, and how to act on it." },
  ],
  partners: [
    { name: "Partner Name", credential: "FCA", focus: "Audit & Assurance" },
    { name: "Partner Name", credential: "FCA", focus: "Direct Tax" },
    { name: "Partner Name", credential: "ACA", focus: "GST" },
    { name: "Partner Name", credential: "ACA", focus: "Advisory" },
  ],
  contact: {
    phone: "+91 00000 00000",
    email: "office@firmname.in",
    address: ["Address line 1", "Hyderabad 500 000", "Telangana, India"],
    hours: "Mon–Sat, 10:00–18:30",
    mapUrl: "https://maps.google.com/?q=Hyderabad",
  },
  disclaimer: {
    short:
      "This website provides information about the firm and its services. It is not an advertisement or a solicitation of work.",
    // DRAFT — the firm must verify this wording against ICAI's current Code of Ethics.
    full: [
      "The information on this website is provided for general information about Firm Name & Co. and the services it offers. It does not constitute professional advice, an advertisement, or a solicitation of work.",
      "No reader should act on the basis of any material on this website without seeking specific professional advice. The firm accepts no liability for any loss arising from reliance on this information.",
      "Links to external websites are provided for convenience; the firm is not responsible for their content.",
    ],
  },
} as const;

export type Site = typeof site;
