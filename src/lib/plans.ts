import { prisma } from "./prisma";

export type PlanView = {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  currency: string;
  billingPeriod: string;
  recommended: boolean;
  features: string[];
};

export async function getActivePlans(): Promise<PlanView[]> {
  const rows = await prisma.plan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    priceCents: p.priceCents,
    currency: p.currency,
    billingPeriod: p.billingPeriod,
    recommended: p.recommended,
    features: p.features
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  }));
}

export function formatPlanPrice(plan: { priceCents: number; currency: string }) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: plan.currency.toUpperCase(),
      maximumFractionDigits: plan.priceCents % 100 === 0 ? 0 : 2,
    }).format(plan.priceCents / 100);
  } catch {
    return `${(plan.priceCents / 100).toFixed(2)} ${plan.currency.toUpperCase()}`;
  }
}

export function planPeriodLabel(period: string) {
  switch (period) {
    case "month":
      return "/ month";
    case "year":
      return "/ year";
    case "one_time":
      return "/ event";
    default:
      return "";
  }
}
