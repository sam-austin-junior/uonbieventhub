import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-scope";
import { SecurityClient } from "./SecurityClient";
import { PasswordChangeCard } from "./PasswordChangeCard";

export default async function SecurityPage() {
  const session = await requireStaff();
  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, totpEnabledAt: true },
  });
  if (!me) redirect("/login");

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Security</h1>
        <p className="text-sm text-ink-500 mt-1">
          Two-factor authentication adds a one-time code from your authenticator app on top of
          your password. Strongly recommended for hub admin and organizer accounts.
        </p>
      </header>

      <div className="space-y-6">
        <PasswordChangeCard />
        <SecurityClient email={me.email} enabledAt={me.totpEnabledAt?.toISOString() ?? null} />
      </div>
    </div>
  );
}
