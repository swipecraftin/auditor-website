import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Manrope } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"], style: ["normal", "italic"], display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.firm.url),
  title: {
    default: `${site.firm.name} · ${site.firm.designation}, ${site.firm.city}`,
    template: `%s · ${site.firm.name}`,
  },
  description: site.hero.sub,
  openGraph: { type: "website", siteName: site.firm.name, locale: "en_IN" },
};

export const viewport: Viewport = { themeColor: "#0B0B0C", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="bg-bg font-sans text-ink antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
