import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEventBySlug } from "@/lib/event";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.uonbieventhub.co.ke";

async function resolveAliasOrRedirect(slug: string): Promise<void> {
  const alias = await prisma.slugAlias.findUnique({
    where: { slug },
    include: { event: { select: { slug: true } } },
  });
  if (!alias) return;
  const pathname = headers().get("x-pathname") ?? `/e/${slug}`;
  const target = pathname.replace(`/e/${slug}`, `/e/${alias.event.slug}`);
  redirect(target);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) {
    await resolveAliasOrRedirect(params.slug);
    return { title: "Event not found" };
  }
  const description =
    event.tagline ||
    (event.description.length > 160
      ? event.description.slice(0, 157) + "…"
      : event.description);
  const url = `${BASE}/e/${event.slug}`;
  const ogImage = event.coverImage ?? `${BASE}/api/e/${event.slug}/og`;

  return {
    title: event.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: event.name,
      description,
      url,
      siteName: event.name,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: event.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: event.name,
      description,
      images: [ogImage],
    },
  };
}

function eventJsonLd(event: {
  name: string;
  description: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  venue: string | null;
  coverImage: string | null;
  logoUrl: string | null;
  organizer: { name: string; email: string };
}) {
  const url = `${BASE}/e/${event.slug}`;
  const image = event.coverImage ?? event.logoUrl ?? undefined;
  const isInPerson = !!event.venue;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    eventAttendanceMode: isInPerson
      ? "https://schema.org/OfflineEventAttendanceMode"
      : "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url,
    image: image ? [image] : undefined,
    location: isInPerson
      ? {
          "@type": "Place",
          name: event.venue,
          address: event.venue,
        }
      : {
          "@type": "VirtualLocation",
          url,
        },
    organizer: {
      "@type": "Organization",
      name: event.organizer.name,
      email: event.organizer.email,
    },
  };
}

export default async function EventRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const event = await getEventBySlug(params.slug);
  if (!event) {
    await resolveAliasOrRedirect(params.slug);
    return <>{children}</>;
  }
  const ld = eventJsonLd({
    name: event.name,
    description: event.description,
    slug: event.slug,
    startDate: event.startDate,
    endDate: event.endDate,
    venue: event.venue,
    coverImage: event.coverImage,
    logoUrl: event.logoUrl,
    organizer: {
      name: event.organizer.name,
      email: event.organizer.email,
    },
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      {children}
    </>
  );
}
