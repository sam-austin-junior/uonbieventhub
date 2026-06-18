import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";

export default async function AdminEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { eventId: string };
}) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);
  return <>{children}</>;
}
