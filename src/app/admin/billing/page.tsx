import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-scope";
import {
  formatMoney,
  renewalCurrency,
  renewalPriceCents,
  stripeConfigured,
} from "@/lib/stripe";
import { CreditCard, Receipt, CheckCircle, AlertTriangle } from "lucide-react";
import { RenewButton } from "./RenewButton";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await requireStaff();
  const [user, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, expiresAt: true, suspendedAt: true, role: true },
    }),
    prisma.payment.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  if (!user) return null;

  const enabled = stripeConfigured();
  const priceCents = renewalPriceCents();
  const currency = renewalCurrency();
  const now = new Date();
  const daysRemaining = user.expiresAt
    ? Math.max(0, Math.ceil((user.expiresAt.getTime() - now.getTime()) / 86_400_000))
    : null;
  const expired = user.expiresAt ? user.expiresAt < now : false;

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ink-900">Billing</h1>
        <p className="text-sm text-ink-500 mt-1">
          Renew your organizer access and review past charges.
        </p>
      </header>

      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-brand-700" /> Subscription
        </h2>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-md bg-ink-50 p-4">
            <div className="text-xs uppercase text-ink-500">Status</div>
            <div className="mt-1 text-lg font-semibold text-ink-900">
              {user.suspendedAt ? (
                <span className="inline-flex items-center gap-1.5 text-red-700">
                  <AlertTriangle className="h-4 w-4" /> Suspended
                </span>
              ) : expired ? (
                <span className="inline-flex items-center gap-1.5 text-red-700">
                  <AlertTriangle className="h-4 w-4" /> Expired
                </span>
              ) : user.expiresAt ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Active
                </span>
              ) : (
                <span className="text-ink-700">No expiry set</span>
              )}
            </div>
          </div>
          <div className="rounded-md bg-ink-50 p-4">
            <div className="text-xs uppercase text-ink-500">Renews / expires</div>
            <div className="mt-1 text-lg font-semibold text-ink-900">
              {user.expiresAt
                ? `${user.expiresAt.toLocaleDateString()} (${daysRemaining} day${daysRemaining === 1 ? "" : "s"})`
                : "—"}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between flex-wrap gap-3 border-t border-ink-100 pt-4">
          <div>
            <div className="text-sm text-ink-500">Renewal price</div>
            <div className="text-xl font-bold text-ink-900">
              {formatMoney(priceCents, currency)} <span className="text-sm font-normal text-ink-500">per term</span>
            </div>
          </div>
          {enabled ? (
            <RenewButton />
          ) : (
            <div className="text-xs text-ink-500 max-w-sm text-right">
              Billing isn't configured yet. The hub admin needs to set
              <span className="font-mono mx-1">STRIPE_SECRET_KEY</span>
              and
              <span className="font-mono mx-1">STRIPE_WEBHOOK_SECRET</span>.
            </div>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2 mb-4">
          <Receipt className="h-4 w-4 text-brand-700" /> Payment history
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-ink-500">No charges yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-2">Date</th>
                  <th className="text-left px-3 py-2">Description</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-6 py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-2 text-ink-700">
                      {(p.paidAt ?? p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-ink-700">{p.description ?? "Payment"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          p.status === "paid"
                            ? "badge-green"
                            : p.status === "failed"
                            ? "badge bg-red-100 text-red-700"
                            : "badge bg-amber-100 text-amber-700"
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-right text-ink-800 font-medium">
                      {formatMoney(p.amountCents, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
