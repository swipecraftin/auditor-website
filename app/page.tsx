import { Facts } from "@/components/sections/Facts";
import { Hero } from "@/components/sections/Hero";
import { Practice } from "@/components/sections/Practice";
import { Services } from "@/components/sections/Services";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Facts />
      <Practice />
      <Services />
    </main>
  );
}
