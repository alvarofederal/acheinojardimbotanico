import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/utils"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/login", "/register", "/verify-email", "/reivindicar/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
