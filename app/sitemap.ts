import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.firm.url, changeFrequency: "yearly", priority: 1 },
    { url: `${site.firm.url}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
