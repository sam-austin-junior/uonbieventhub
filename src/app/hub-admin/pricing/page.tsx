import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PlansEditor } from "./PlansEditor";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/hub-admin/pricing");
  if (session.role !== "SUPERADMIN") redirect("/");

  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Plans &amp; pricing</h1>
        <p className="text-sm text-ink-500 mt-1">
          What organisations see on the public pricing page and what they pay at
          checkout. Only the hub admin can edit this.
        </p>
      </header>

      <PlansEditor
        initialPlans={plans.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          priceCents: p.priceCents,
          currency: p.currency,
          billingPeriod: p.billingPeriod,
          recommended: p.recommended,
          active: p.active,
          sortOrder: p.sortOrder,
          features: p.features,
        }))}
      />
    </div>
  );
}
