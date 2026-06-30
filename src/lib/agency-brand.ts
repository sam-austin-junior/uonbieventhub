import { prisma } from "./prisma";

export type AgencyBrand = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  supportEmail: string | null;
  website: string | null;
};

/**
 * Resolve the agency that brands a given event (via its organizer).
 * Returns null when the organizer isn't on any agency — caller falls
 * back to the default "Powered by UoN Event Hub" treatment.
 *
 * Lookup is a single Prisma call; safe to invoke from any server
 * component or route handler that renders event chrome.
 */
export async function getEventAgencyBrand(
  organizerId: string,
): Promise<AgencyBrand | null> {
  const organizer = await prisma.user.findUnique({
    where: { id: organizerId },
    select: { agency: true },
  });
  if (!organizer?.agency) return null;
  return {
    id: organizer.agency.id,
    slug: organizer.agency.slug,
    name: organizer.agency.name,
    logoUrl: organizer.agency.logoUrl,
    supportEmail: organizer.agency.supportEmail,
    website: organizer.agency.website,
  };
}
