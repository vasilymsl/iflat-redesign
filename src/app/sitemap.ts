import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${siteConfig.domain}`;

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/internet/flat`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/internet/home`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/tv`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/action`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/payment`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/company`, lastModified: new Date(), priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.8 },
  ];
}
