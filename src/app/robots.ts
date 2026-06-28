import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.uonbieventhub.co.ke";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/e/"],
        disallow: [
          "/admin",
          "/hub-admin",
          "/api/",
          "/login",
          "/forgot",
          "/reset",
          "/uploads/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
