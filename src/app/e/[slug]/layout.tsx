import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/event";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return { title: "Event not found" };
  }
  const description =
    event.tagline ||
    (event.description.length > 160
      ? event.description.slice(0, 157) + "…"
      : event.description);
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/e/${event.slug}`;
  const image = event.coverImage ?? event.logoUrl ?? undefined;

  return {
    title: event.name,
    description,
    openGraph: {
      title: event.name,
      description,
      url,
      siteName: event.name,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: event.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function EventRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
