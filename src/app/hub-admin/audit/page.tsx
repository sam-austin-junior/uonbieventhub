import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "organizer.create": "Organizer account created",
  "organizer.suspend": "Organizer suspended",
  "organizer.reactivate": "Organizer reactivated",
  "organizer.password_reset": "Organizer password reset",
  "event.clone": "Event duplicated",
  "event.suspend": "Event suspended",
  "platform.config.update": "Platform settings updated",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { action?: string };
}) {
  const where: any = {};
  if (searchParams.action) where.action = searchParams.action;

  const [entries, distinctActions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { actor: { select: { name: true, email: true, avatarUrl: true } } },
    }),
    prisma.auditLog.groupBy({ by: ["action"], _count: { action: true } }),
  ]);

  return (
    <div className="p-4 sm:p-8">
      <header className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 inline-flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-700" /> Audit log
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Every staff-side action on the platform. Most recent 200 shown.
          </p>
        </div>
        <form className="flex gap-2" action="">
          <select name="action" defaultValue={searchParams.action ?? ""} className="input w-56">
            <option value="">All actions</option>
            {distinctActions.map((a) => (
              <option key={a.action} value={a.action}>
                {ACTION_LABELS[a.action] ?? a.action} ({a._count.action})
              </option>
            ))}
          </select>
          <button className="btn-primary text-xs">Filter</button>
        </form>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-5 py-3 text-left">When</th>
                <th className="px-5 py-3 text-left">Actor</th>
                <th className="px-5 py-3 text-left">Action</th>
                <th className="px-5 py-3 text-left">Summary</th>
                <th className="px-5 py-3 text-left">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-ink-50">
                  <td className="px-5 py-3 text-ink-500 whitespace-nowrap text-xs">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={e.actorName ?? e.actorEmail ?? "—"} src={e.actor?.avatarUrl ?? null} size={28} />
                      <div className="min-w-0">
                        <div className="font-medium text-ink-900 truncate">
                          {e.actorName ?? "—"}
                        </div>
                        <div className="text-xs text-ink-500 truncate">{e.actorEmail ?? ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="badge-brand font-mono text-[10px]">{e.action}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-700">{e.summary}</td>
                  <td className="px-5 py-3 text-ink-500 text-xs font-mono">
                    {e.targetType ? `${e.targetType}:${e.targetId?.slice(0, 8) ?? ""}…` : "—"}
                  </td>
                </tr>
              ))}
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink-500">
                    No audit entries yet. Actions get recorded as you use the platform.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
