import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.uonbieventhub.co.ke";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/forgot`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  let events: { slug: string; updatedAt: Date; endDate: Date }[] = [];
  try {
    events = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, endDate: true },
      orderBy: { startDate: "desc" },
      take: 5000,
    });
  } catch {
    // If the database is unreachable (e.g. CI build without a real DB),
    // serve the sitemap with only the static entries so the build still
    // succeeds. The runtime request on Vercel will hit the real DB.
    return staticEntries;
  }

  const eventEntries: MetadataRoute.Sitemap = events.map((e) => {
    const upcoming = e.endDate >= now;
    return {
      url: `${BASE}/e/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: upcoming ? "daily" : "monthly",
      priority: upcoming ? 0.9 : 0.5,
    };
  });

  return [...staticEntries, ...eventEntries];
}
