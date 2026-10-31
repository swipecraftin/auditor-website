import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Manrope } from "next/font/google";
import "lenis/dist/lenis.css";
import { Footer } from "@/components/layout/Footer";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { MotionProvider } from "@/components/motion/MotionProvider";
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

// Runs before first paint: `motion-ok` hides animated elements until controllers reveal them.
// If hydration never happens (`motion-ready` missing after 4 s) the content is shown anyway.
const MOTION_BOOT = `(function(){var d=document.documentElement;d.classList.add("js");if(window.matchMedia&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("motion-ok");setTimeout(function(){if(!d.classList.contains("motion-ready"))d.classList.remove("motion-ok")},4000)}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      </head>
      <body className="bg-bg font-sans text-ink antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        <MotionProvider>
          <SiteChrome />
          {children}
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
