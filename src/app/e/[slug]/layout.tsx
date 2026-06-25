import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEventBySlug } from "@/lib/event";

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
  }
  return <>{children}</>;
}
