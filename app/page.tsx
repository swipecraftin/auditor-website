import { HeroMotion } from "@/components/motion/HeroMotion";
import { Contact } from "@/components/sections/Contact";
import { Facts } from "@/components/sections/Facts";
import { Hero } from "@/components/sections/Hero";
import { Partners } from "@/components/sections/Partners";
import { Practice } from "@/components/sections/Practice";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { JsonLd } from "@/components/seo/JsonLd";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Facts />
      <Practice />
      <Services />
      <Process />
      <Partners />
      <Contact />
      <JsonLd />
      <HeroMotion />
    </main>
  );
}
