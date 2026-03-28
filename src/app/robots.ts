import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rekro.com.au";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/properties", "/units"],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/_next/",
          "/private/",
          "/*?*sort=", // Disallow sorted/filtered views to prevent duplicate content
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

