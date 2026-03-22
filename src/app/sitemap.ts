import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://irvineallstars.com";

  const publicPages = [
    "",
    "/coaches",
    "/tryouts",
    "/timeline",
    "/faq",
    "/documents",
    "/updates",
    "/apply/coach",
    "/apply/player",
  ];

  return publicPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
