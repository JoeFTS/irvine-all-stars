import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/portal/", "/coach/", "/evaluate/", "/auth/"],
    },
    sitemap: "https://irvineallstars.com/sitemap.xml",
  };
}
